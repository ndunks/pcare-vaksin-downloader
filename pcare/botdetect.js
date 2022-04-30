const BotDetect = {}

BotDetect.M = (a, b, c) => {
    this._p = a;
    this._m = BotDetect.CM(this._p);
    this._bm = BotDetect.CInt2B(this._m);
}
BotDetect.CInt2B = function (a) {
    return (a >>> 0).toString(2)
}
BotDetect.CM = function (a) {
    return a % 65533 + 1
}
BotDetect.CC2C = function (a, b) {
    b = b.split("");
    var c = b.length
        , m = a.split("")
        , d = "";
    for (a = a.length - 1; 0 <= a; a--) {
        var n = b[c-- - 1];
        n = "undefined" !== typeof n && "1" === n ? m[a].toUpperCase() : m[a].toLowerCase();
        d = n + d
    }
    return d
}

function botdetectResolve(sp, chars) {
    console.log('RESULV', sp, chars);
    var _p = sp;
    var _m = BotDetect.CM(_p);
    var _bm = BotDetect.CInt2B(_m);
    return BotDetect.CC2C(chars, _bm)
}
module.exports = { botdetectResolve }