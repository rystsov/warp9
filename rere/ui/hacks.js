expose({
    unrecursion: unrecursion,
    once: once
});

// https://gist.github.com/rystsov/5898584
// https://code.google.com/p/chromium/issues/detail?id=117307
function unrecursion(f) {
    var active = false;
    return function() {
        if (active) return;
        active = true;
        f.apply(null, arguments);
        active = false;
    };
}

function once(f) {
    var called = false;
    return function() {
        if (called) return;
        called = true;
        f();
    };
}