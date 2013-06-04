define(function() {
    function channel() {
        this["rere/reactive/Channel"] = true;
        this["rere/reactive/Channel/dependants"] = [];
        
        this.T = channel;
        this.subscribe = function(f) {
            this["rere/reactive/Channel/dependants"].push(f)
        };
        this.raise = function(value) {
            for (var i in this["rere/reactive/Channel/dependants"]) {
                var f = this["rere/reactive/Channel/dependants"][i];
                f(value);
            }
        };
        this.lift = function(f) {
            var channel = new this.T();
            this.subscribe(function(x){
                channel.raise(f(x));
            })
            return channel;
        };
        this.follows = function() {
            var self = this;
            var what = arguments[0];
            var how = arguments.length>1 ? arguments[1] : null;
            what.subscribe(function(value){
                self.raise(how==null ? value : how(value))
            });
        }
    }
    channel.zip = function() {
        var r = new channel();
        for (var i in arguments) {
            arguments[i].subscribe(function(e){
                r.raise(e);
            });
        }
        return r;
    }
    return channel;
});
