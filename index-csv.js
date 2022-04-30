require('dotenv').config()
const fs = require('fs')
const readline = require('readline');
const { stringify: csvStringify } = require('csv-stringify');

const { dirname, join } = require('path')
const niksTxt = process.argv[process.argv.length - 1]
if (!fs.existsSync(niksTxt)) {
    console.error('NIKs file not found')
    process.exit(1)
}
if( !niksTxt.match(/\.txt$/) ){
    console.error('Not TEXT FILE');
    process.exit(1);
}
if (!process.env.DATA_DIR) {
    process.env.DATA_DIR = '.data'
}
if (!fs.existsSync(process.env.DATA_DIR)) {
    fs.mkdirSync(process.env.DATA_DIR)
}
const outputFile = niksTxt.replace(/txt$/,'csv')

const PCare = require('./pcare')
const { decodeResponse } = require('./pcare/lib')

let keepAliveTimer = 0
let nextWatTimer = 0

async function keepAliveWatcher() {
    const loggedIn = await PCare.keepAliveCheck()
    if (loggedIn) {
        keepAliveTimer = setTimeout(() => keepAliveWatcher(), 10 * 1000)
    } else {
        console.error('Keep alive failed')
    }
}
async function countLine(fileTxt) {
    return new Promise((r, j) => {
        let count = 0;
        const file = readline.createInterface({
            input: fs.createReadStream(fileTxt),
            terminal: false
        });
        file.on('close', () => r(count))
        file.on('line', (line) => count++);
    })

}

const parseRowRiwayat = (nik, items) => {
    const row = [
        new Date().toUTCString(), // 0 date
        nik, // 1 nik
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

PCare.login().then(
    async () => {
        const niks = fs.readFileSync(niksTxt, 'ascii').split("\n");
        console.log('Total NIK', niks.length);
        let startIndex = 0;
        if (fs.existsSync(outputFile)) {
            startIndex = await countLine(outputFile);
        }

        const csvFile = fs.createWriteStream(outputFile, { flags: 'a' })
        const csv = csvStringify({
            columns: [
                'nik',
                'vaccineLast',
                'vaccineLastType',
                'vaccineLastTypeName',
                'vaccineLastDate',
                'vaccineLastLocation',
                'raw',
            ]
        })
        csv.pipe(csvFile)
        if (startIndex > 0) {
            console.log('Resume from', startIndex);
        } else {
            csv.write(['nik',
            'vaccineLast',
            'vaccineLastType',
            'vaccineLastTypeName',
            'vaccineLastDate',
                'vaccineLastLocation',
                'raw',])
            }
            const clearing = () => {
            console.log("Clearing..");
            clearTimeout(keepAliveTimer);
            if (nextWatTimer) {
                clearTimeout(nextWatTimer);
                nextWatTimer = 0
            }
            csv.destroy()
            fs.closeSync(csvFile)
        }
        process.on("SIGINT", clearing);
        process.once("SIGUSR2", clearing)
        keepAliveWatcher()
        
        let error = null;
        const max = niks.length;
        let nik, index = startIndex
        while(index < max) {
            nik = niks[index++]
            if(!nik) continue
            let pcareData;
            do {
                error = null
                try {
                    pcareData = await PCare.riwayatVaksin(nik)
                    console.log('NIK:', nik, 'OK')
                } catch (err) {
                    const code = err.response?.status || 0
                    console.log('NIK:',
                        nik,
                        code,
                        typeof err.response?.data == 'string' ?
                            decodeResponse(err.response?.data) :
                            err.response?.data
                    );
                    if (code != 404) {
                        index--
                        error = err
                        console.log('Sleeping.. zzZZZzz..');
                        await new Promise(r => nextWatTimer = setTimeout(r, code == 429 ? 10000 : 5000))
                        PCare.keepAliveCheck()
                        nextWatTimer = 0
                    } else {
                        console.log('Skiped');
                    }
                }
            } while (error)
            csv.write(parseRowRiwayat(nik, pcareData))
        }
        console.log('~~~ DONE ~~~');
    }
)