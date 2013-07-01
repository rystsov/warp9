define([], function() {
return function(rere) {

return {
    // https://gist.github.com/rystsov/5898584
    // https://code.google.com/p/chromium/issues/detail?id=117307
    unrecursion: function(f) {
        var active = false;
        return function() {
            if (active) return;
            active = true;
            f.apply(null, arguments);
            active = false;
        }
    }
};

};
});
