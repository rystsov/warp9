define(function() {
    return {
        "Value" : function(v) {
            this.isValue = true;
            this.value = v;
        },
        "Error" : function(message) {
            this.isError = true;
            this.message = message;
        },
        "concat" : function() {
            return (function(ms) {
                return function(v) {
                    var v = m.error.value(v)
                    for(var i=0;i<ms.length;i++) {
                        v = ms[i](v.value)
                        if (v.isError) return v
                        if (v.isValue) continue
                        throw new Error()
                    }
                    return v
                }
            })(arguments)
        }
    }
});
