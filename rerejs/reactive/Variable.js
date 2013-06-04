define(["rere/adt/maybe"], function(maybe) {
    function variable() {
        this["rere/reactive/Channel"] = true;
        this["rere/reactive/Variable"] = true;
        this["rere/reactive/Channel/dependants"] = [];
        this["rere/reactive/Channel/dependants/id"] = 0;
        this["rere/reactive/Variable/value"] = new maybe.None();
    
        this.T = variable;
        this.subscribe = function(f) {
            return this.onEvent(function(e){
                if (e[0]==="set") {
                    f(e[1]);
                }
            });
        };
        this.onEvent = function(f) {
            var self = this;
            var id = this["rere/reactive/Channel/dependants/id"];
            this["rere/reactive/Channel/dependants/id"]++;
            this["rere/reactive/Channel/dependants"].push({key: id, f:f});
            if (!this["rere/reactive/Variable/value"].isempty()) {
                f(["set", this["rere/reactive/Variable/value"].value()]);
            }
            return function() {
                self["rere/reactive/Channel/dependants"] = self["rere/reactive/Channel/dependants"].filter(function(dependant) {
                    return dependant.key!=id;
                });
            }
        };
        this.value = function() {
            return this["rere/reactive/Variable/value"]
        };
        this.raise = function(value) {
            if (!this["rere/reactive/Variable/value"].hasvalue(value)) {
                this["rere/reactive/Variable/value"] = new maybe.Some(value)
                variable.raise(this, ["set", value])
            }
        };
        this.lift = function(f) {
            var channel = new this.T();
            this.onEvent(function(e){
                variable.replay(channel, e, f);
            })
            return channel;
        };
        this.follows = function() {
            var self = this;
            var what = arguments[0];
            var how = arguments.length>1 ? arguments[1] : function(x) { return x; };
            return what.onEvent(function(e){
                variable.replay(self, e, how);
            })
        }
        this.set = function(value) {
            this.raise(value);
        };
        this.unset = function() {
            this["rere/reactive/Variable/value"] = new maybe.None();
            variable.raise(this, ["unset"])
        };

        if (arguments.length>0) {
            this.raise(arguments[0])
        }
    }
    variable.zip = function() {
        var r = new variable();
        for (var i in arguments) {
            arguments[i].subscribe(function(e){
                r.set(e);
            });
        }
        return r;
    }
    
    variable.raise = function(self, e) {
        for (var i in self["rere/reactive/Channel/dependants"]) {
            var f = self["rere/reactive/Channel/dependants"][i].f;
            f(e);
        }
    }

    variable.replay = function (self, e, f) {
        if (e[0]==="set") {
            self.set(f(e[1]));
        } else if (e[0]==="unset") {
            self.unset()
        } else {
            throw new Error();
        }
    }

    return variable;
});
