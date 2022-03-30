// get the client
const mysql = require('mysql2/promise');
const fs = require('fs')
let con;
const OpenSID = {
    data: {
        currentPage: 0,
        totalPage: 0,
        totalCandidate: 0,
        perPage: 10,
    },
    where: "not isnull(nik) and nik > 1000000000  and tanggallahir <= date('2016-03-01')",
    async connect() {
        con = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            database: process.env.MYSQL_DATABASE,
            password: process.env.MYSQL_PASSWORD
        });
        if (fs.existsSync('.data/opensid.json')) {
            this.load()
            console.log(this.data);
        } else {
            // count total
            this.data.totalCandidate = await con.query(`SELECT count(*) as total from tweb_penduduk  WHERE ${this.where}`).then(
                res => res[0][0].total
            )
            this.data.totalPage = Math.ceil(this.data.totalCandidate / this.data.perPage)
        }
    },
    close() {
        if (con) {
            con.destroy()
        }
    },
    load() {
        this.data = JSON.parse(fs.readFileSync('.data/opensid.json', 'ascii'))
    },
    save() {
        return fs.writeFileSync('.data/opensid.json', JSON.stringify(this.data, null, 2))
    },
    next() {
        const offset = this.data.currentPage * this.data.perPage
        this.data.currentPage++;
        return con.query(`SELECT id, nik from tweb_penduduk  WHERE ${this.where} LIMIT ${offset}, ${this.data.perPage}`)
            .then(rows => rows[0] || null)
    },
    async insertVaksin(rows) {
        const sql = await con.query(`INSERT INTO vaksin (
            id_penduduk, nik, vaccineId, fullName, mobileNumber,
            bornDate,age,raw,vaccineLast,vaccineLastType,vaccineLastTypeName,
            vaccineLastDate, vaccineLastLocation
           ) VALUES ? ON DUPLICATE KEY UPDATE
            id_penduduk = VALUES(id_penduduk),
            vaccineId = VALUES(vaccineId),
            fullName = VALUES(fullName),
            mobileNumber = VALUES(mobileNumber),
            bornDate = VALUES(bornDate),
            age = VALUES(age),
            raw = VALUES(raw),
            vaccineLast = VALUES(vaccineLast),
            vaccineLastType = VALUES(vaccineLastType),
            vaccineLastTypeName = VALUES(vaccineLastTypeName),
            vaccineLastDate = VALUES(vaccineLastDate),
            vaccineLastLocation = VALUES(vaccineLastLocation)
           `, [rows])
        return;
    },
    checkHasVaccineId(nik) {
        return con.query('SELECT 1 from vaksin WHERE nik = ? and not isnull(vaccineId)', [nik])
            .then(
                res => res[0].length
            )
    }
}


module.exports = OpenSID