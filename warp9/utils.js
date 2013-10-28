expose({
    hashLen: hashLen,
    hashValues: hashValues,
    checkBool: checkBool
});

function checkBool(x) {
    if (typeof x == "boolean") return x;
    throw new Error();
}

function hashLen(hash) {
    var count = 0;
    for (var i in hash) {
        if (!hash.hasOwnProperty(i)) continue;
        count++;
    }
    return count;
}

function hashValues(hash) {
    var values = [];
    for (var i in hash) {
        if (!hash.hasOwnProperty(i)) continue;
        values.push(hash[i]);
    }
    return values;
}