require('dotenv').config()
const fs = require('fs')
const path = require('path')
const pcare = require('./pcare')

const DATA_DIR = path.resolve('.data')
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR)
}
let keepAliveTimer = 0

async function keepAliveWatcher() {
    const loggedIn = await pcare.keepAliveCheck()
    if (loggedIn) {
        keepAliveTimer = setTimeout(() => keepAliveWatcher(), 10 * 1000)
    } else {
        console.error('Keep alive failed')
    }
}

pcare.login().then(
    async () => {
        const clearing = () => {
            console.log("Clearing..");
            clearTimeout(keepAliveTimer)
        }
        process.on("SIGINT", clearing);
        process.once("SIGUSR2", clearing)
        keepAliveWatcher()
        console.log('PCare Logged in');
        const result = await pcare.vaksinasi('3304021207910003');
        //fs.writeFileSync('sample.json', JSON.stringify(result, null, 2))
    }
)