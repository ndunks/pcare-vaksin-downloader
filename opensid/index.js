// get the client
const mysql = require('mysql2');


const OpenSID = {
    connect() {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            database: process.env.MYSQL_DATABASE,
            password: process.env.PASSWORD
        });
    },
    insertVaksin(data){

    }
}


module.exports = OpenSID