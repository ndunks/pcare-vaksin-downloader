require('dotenv').config()
const fs = require('fs')
if(!process.env.DATA_DIR){
    process.env.DATA_DIR = '.data'
}
const isUpdate = process.argv[process.argv.length - 1] == 'update'
if (!fs.existsSync(process.env.DATA_DIR)) {
    fs.mkdirSync(process.env.DATA_DIR)
}
const OpenSID = require('./opensid')
const Pcare = require('./pcare')
const PCare = require('./pcare')
const { decodeResponse } = require('./pcare/lib')

let keepAliveTimer = 0
let nextWatTimer = 0
const typeSorts = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5,
    sixth: 6,
    seventh: 7,
    eighth: 8,
    nineth: 9,
    tenth: 10,
}


async function keepAliveWatcher() {
    const loggedIn = await PCare.keepAliveCheck()
    if (loggedIn) {
        keepAliveTimer = setTimeout(() => keepAliveWatcher(), 10 * 1000)
    } else {
        console.error('Keep alive failed')
    }
}

const parseRow = (opensid, pcare) => {
    const row = [
        opensid.id, // 0 id_penduduk
        opensid.nik, // 1 nik
        null, // 2 vaccineId
        null, // 3 fullName
        null, // 4 mobileNumber
        null, // 5 bornDate
        null, // 6 age
        null, // 7 raw
        null, // 8 vaccineLast
        null, // 9 vaccineLastType
        null, // 10 vaccineLastTypeName
        null, // 11 vaccineLastDate
        null, // 12 vaccineLastLocation
    ]
    if (!pcare || !Array.isArray(pcare.vaccine)) return row

    row[2] = pcare.vaccineId // vaccineId
    row[3] = pcare.fullName // fullName
    row[4] = pcare.mobileNumber // mobileNumber
    row[5] = pcare.bornDate // bornDate
    row[6] = pcare.age // age
    row[7] = JSON.stringify(pcare) // raw

    const vaccine = pcare.vaccine
        .filter(v => v.status == 'vaccinated')
        .sort(
            (a, b) => typeSorts[b.type] - typeSorts[a.type]
        )[0] || {}

    if (vaccine && vaccine.type) {
        row[8] = typeSorts[vaccine.type] // vaccineLast
        row[9] = vaccine.vaccinated?.vaccineType // vaccineLastType
        row[10] = vaccine.vaccinated?.VaccineTypeName // vaccineLastTypeName
        row[11] = vaccine.vaccinated?.date // vaccineLastDate
        row[12] = vaccine.hospital?.name // vaccineLastLocation
    };
    return row
}
const parseRowRiwayat = (opensid, items) => {
    const row = [
        opensid.id, // 0 id_penduduk
        opensid.nik, // 1 nik
        null, // 2 vaccineLast
        null, // 3 vaccineLastType
        null, // 4 vaccineLastTypeName
        null, // 5 vaccineLastDate
        null, // 6 vaccineLastLocation
        null, // 7 raw
    ]
    if (!items || !Array.isArray(items)) return row
    row[7] = JSON.stringify(items) // raw

    const vaccine = items
        .filter(v => v.status == 'TELAH VAKSIN')
        .sort(
            (a, b) => b.vaksinKe - a.vaksinKe
        )[0] || {}
    if (vaccine && vaccine.vaksinKe) {
        row[2] = vaccine.vaksinKe // vaccineLast
        row[3] = vaccine.kdVaksin // vaccineLastType
        row[4] = vaccine.nmVaksin // vaccineLastTypeName
        row[5] = (vaccine.tglVaksin || '').split('-').reverse().join('-') // vaccineLastDate
        row[6] = vaccine.nmppk_pelayanan // vaccineLastLocation
    };
    return row
}
OpenSID.connect()
    .then(() => PCare.login())
    .then(
        async () => {
            const clearing = () => {
                console.log("Clearing..");
                clearTimeout(keepAliveTimer);
                if (nextWatTimer) {
                    clearTimeout(nextWatTimer);
                    nextWatTimer = 0
                }
                OpenSID.close()
            }
            process.on("SIGINT", clearing);
            process.once("SIGUSR2", clearing)
            keepAliveWatcher()
            //console.log('PCare Logged in', await PCare.riwayatVaksin('3304021207910003'));
            //process.exit(0)

            let ids;
            let error = null;
            while (ids = await OpenSID.next()) {
                if (ids.length == 0) break;
                console.log('Next', OpenSID.data.currentPage);
                const rows = []
                for (let opensid of ids) {
                    let pcareData;
                    const exists = isUpdate ? false : await OpenSID.checkHasVaccineId(opensid.nik)
                    if ( !exists) {
                        do {
                            error = null
                            try {
                                pcareData = await PCare.riwayatVaksin(opensid.nik)
                                console.log('NIK:', opensid.nik, 'OK')
                            } catch (err) {
                                const code = err.response?.status || 0
                                console.log('NIK:',
                                    opensid.nik,
                                    code,
                                    typeof err.response?.data == 'string' ?
                                        decodeResponse(err.response?.data) :
                                        err.response?.data
                                );
                                if (code != 404) {
                                    error = err
                                    console.log('Sleeping.. zzZZZzz..');
                                    await new Promise(r => nextWatTimer = setTimeout(r, code == 429 ? 30000 : 5000))
                                    Pcare.keepAliveCheck()
                                    nextWatTimer = 0
                                } else {
                                    console.log('Skiped');
                                }
                            }
                        } while (error)
                        rows.push(parseRowRiwayat(opensid, pcareData))
                    } else {
                        console.log('NIK:', opensid.nik, 'SKIP')
                    }
                }

                if (rows.length) {
                    await OpenSID.insertVaksinRiwayat(rows)
                }
                OpenSID.save()
            }
            console.log('~~~ DONE ~~~');
            //const result = await pcare.vaksinasi('3304021207910003');
            //fs.writeFileSync('sample.json', JSON.stringify(result, null, 2))
        }
    )