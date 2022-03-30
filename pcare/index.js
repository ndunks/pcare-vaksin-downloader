const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const https = require('https');
const { writeFileSync, open, openSync, createWriteStream, unlinkSync, unlink } = require('fs');
const cp = require('child_process');
const { join } = require('path');
const { tmpdir } = require('os');
const qs = require('qs');
const { randomBytes } = require('crypto');
const { encodeRequest, decodeResponse } = require('./lib');
const CookieFileStore = require('tough-cookie-file-store').FileCookieStore
process.env.NODE_OPTIONS = "--tls-cipher-list='ECDHE - RSA - AES128 - GCM - SHA256: !RC4'"
const jar = new CookieJar(new CookieFileStore('.data/cookie.json'));
const agent = new https.Agent({
    rejectUnauthorized: false,
    checkServerIdentity: false,
});
/** @type import('axios').AxiosInstance */
const client = wrapper(axios.create({
    jar, agent,
    baseURL: "https://pcare.bpjs-kesehatan.go.id/vaksin",

}));
const Pcare = {
    resolveCaptcha() {
        return client.get('Login/login')
            .then(
                ({ data }) => ({
                    ...data.match(
                        /<img class="BDC_CaptchaImage" id="AppCaptcha_CaptchaImage" src="\/vaksin\/(?<src>[^\"]+)?"/).groups,
                    ...data.match(/<input name="__RequestVerificationToken" type="hidden" value="(?<token>[^\"]+)?"/).groups,
                })
            ).then(
                ({ src, token }) => client.get(src.replace('&amp;', '&'), { responseType: 'stream' }).then(
                    ({ data }) => new Promise((r, j) => {
                        console.log(src, token);
                        const tmp = join(tmpdir(), randomBytes(8).toString('hex') + '.jpg')
                        const handle = createWriteStream(tmp)
                        const readline = require('readline').createInterface({
                            input: process.stdin,
                            output: process.stdout
                        });
                        data.once('end', () => {
                            console.log('File written', tmp);
                            let captcha = ''
                            const pid = cp.spawn('xdg-open', [tmp], {
                                detached: true,
                                stdio: 'pipe'
                            })
                            pid.once('error', j)
                            readline.question('Captcha: ', val => {
                                captcha = val
                                pid.kill()
                                readline.close();
                                r({
                                    captcha,
                                    token,
                                    instanceId: src.match(/;t=(.+)$/)[1]
                                })
                                unlinkSync(tmp)
                            });
                        })
                        data.once('error', j)
                        data.pipe(handle)

                    })
                )
            ).catch(e => {
                console.error(e.message || e)
            })
    },
    keepAliveCheck() {
        return client.get('keepAlive/check').then(res => {
            console.log('keepAlive',res.status, res.headers['content-type'])
            // process.exit(0)
            return res.status == 200 && typeof res.data == 'object'
        })
            .catch(e => {
                console.error(e.message || e);
                return e.response?.status
            })
    },
    async login() {
        // check login
        if (await this.keepAliveCheck()) {
            return Promise.resolve(true)
        }
        // resolve captcha
        let captcha, loggedIn;
        do {
            console.log('Please Login..');
            do {
                captcha = await this.resolveCaptcha()
            } while (!captcha)
            console.log(captcha);
            const params = {
                __RequestVerificationToken: captcha.token,
                username: process.env.PCARE_USER,
                password: process.env.PCARE_PASSWORD,
                CaptchaInputText: captcha.captcha,
                captchaid: 'AppCaptcha',
                instanceid: captcha.instanceId
            }
            loggedIn = await client.post('Login/login', qs.stringify(params), {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                }
            }).then(
                ({ data }) => {
                    console.log(data)
                    return data
                }
            )
        } while (!loggedIn || !await this.keepAliveCheck())
    },
    vaksinasi(nik) {
        return client.post('/Broker/ticket_nik', { data: encodeRequest({ nik }) })
            .then(({ data }) => decodeResponse(data))
            .catch( err => {
                console.log('Eee', err.message);
            })
    }

}

module.exports = Pcare