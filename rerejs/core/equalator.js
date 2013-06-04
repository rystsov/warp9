define(function() {
    return {
        "hook": "rere/core/equalator/equals",
        "areEquals" : function(a,b) {
            if (a==null || b==null) return a==b;
            if (typeof a=="object") {
                if (this.hook in a) {
                    return a[this.hook](b)
                }
                if (a instanceof Array && b instanceof Array) {
                    if (a.length != b.length) return false;
                    for (var i in a) {
                        if (!this.areEquals(a[i], b[i])) return false;
                    }
                    return true;
                }
            }
            return a==b;
        }
    }
});
