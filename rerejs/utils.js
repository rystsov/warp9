expose({ hashLen: hashLen });

function hashLen(hash) {
    var count = 0;
    for (var i in hash) {
        if (!hash.hasOwnProperty(i)) continue;
        count++;
    }
    return count;
}
