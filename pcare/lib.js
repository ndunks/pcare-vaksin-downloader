const LZString = require('lz-string')
const CryptoJS = require('crypto-js')
var t = "b!JtC$!k7RL&aE!pt8%a-=xnJz7H4q3nVGwx5?49*ewPcC3Q@yQTuKVPf_f!y+$DPtXR$R?QB&C#!rr$K!@QZ9Zh8QMRQbDjSRBASjR@_C+w8Nq^+gQr-Vd47-Bm52Xu",
    n = {
        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
        encode: function (t) {
            var e = "",
                o, i, r, h, c, s, u, f = 0;
            for (t = n._utf8_encode(t); f < t.length;) o = t.charCodeAt(f++), i = t.charCodeAt(f++), r = t.charCodeAt(f++), h = o >> 2, c = (o & 3) << 4 | i >> 4, s = (i & 15) << 2 | r >> 6, u = r & 63, isNaN(i) ? s = u = 64 : isNaN(r) && (u = 64), e = e + this._keyStr.charAt(h) + this._keyStr.charAt(c) + this._keyStr.charAt(s) + this._keyStr.charAt(u);
            return e
        },
        decode: function (t) {
            var i = "",
                o, s, h, c, f, u, e, r = 0;
            for (t = t.replace(/[^A-Za-z0-9\+\/\=]/g, ""); r < t.length;) c = this._keyStr.indexOf(t.charAt(r++)), f = this._keyStr.indexOf(t.charAt(r++)), u = this._keyStr.indexOf(t.charAt(r++)), e = this._keyStr.indexOf(t.charAt(r++)), o = c << 2 | f >> 4, s = (f & 15) << 4 | u >> 2, h = (u & 3) << 6 | e, i = i + String.fromCharCode(o), u != 64 && (i = i + String.fromCharCode(s)), e != 64 && (i = i + String.fromCharCode(h));
            return n._utf8_decode(i)
        },
        _utf8_encode: function (n) {
            var i, r, t;
            for (n = n.replace(/\r\n/g, "\n"), i = "", r = 0; r < n.length; r++) t = n.charCodeAt(r), t < 128 ? i += String.fromCharCode(t) : t > 127 && t < 2048 ? (i += String.fromCharCode(t >> 6 | 192), i += String.fromCharCode(t & 63 | 128)) : (i += String.fromCharCode(t >> 12 | 224), i += String.fromCharCode(t >> 6 & 63 | 128), i += String.fromCharCode(t & 63 | 128));
            return i
        },
        _utf8_decode: function (n) {
            for (var r = "", t = 0, i = c1 = c2 = 0; t < n.length;) i = n.charCodeAt(t), i < 128 ? (r += String.fromCharCode(i), t++) : i > 191 && i < 224 ? (c2 = n.charCodeAt(t + 1), r += String.fromCharCode((i & 31) << 6 | c2 & 63), t += 2) : (c2 = n.charCodeAt(t + 1), c3 = n.charCodeAt(t + 2), r += String.fromCharCode((i & 15) << 12 | (c2 & 63) << 6 | c3 & 63), t += 3);
            return r
        }
    };
const enkripdekrip = {
    tutup: function (i) {
        return i = n.encode(i), CryptoJS.AES.encrypt(i, t).toString()
    },
    buka: function (i) {
        return n.decode(CryptoJS.AES.decrypt(i, t).toString(CryptoJS.enc.Utf8))
    }
}

function decodeResponse(response) {
    return JSON.parse(LZString.decompressFromEncodedURIComponent(response))
}

function encodeRequest(request) {
    const encoded = enkripdekrip.tutup(LZString.compressToEncodedURIComponent(JSON.stringify(request)))
    return encoded
}



module.exports = { encodeRequest, decodeResponse }

