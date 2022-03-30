const fs = require('fs')
const path = require('path')

const DATA_DIR = path.resolve('.data')
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR)
}

const Data = {
    DIR: DATA_DIR,
    /**
     * @param {ArrayBuffer} buffer 
     */
    displayCaptcha(buffer) {

    }
}

export default Data