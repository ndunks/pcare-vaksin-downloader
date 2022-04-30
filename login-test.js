require('dotenv').config()
const fs = require('fs')
if (!process.env.DATA_DIR) {
    process.env.DATA_DIR = '.data'
}
if (!fs.existsSync(process.env.DATA_DIR)) {
    fs.mkdirSync(process.env.DATA_DIR)
}

const PCare = require('./pcare')

PCare.login().then(
    () => {
        console.log('LOGIN OK!');
    }
)