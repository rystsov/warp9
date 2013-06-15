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
            if (this["rere/reactive/Variable/value"].isempty()) {
                f(["unset"]);
            } else {
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

    variable.prototype.lift = function(f) {
        var channel = new this.T();
        this.onEvent(function(e){
            variable.replay(channel, e, f);
        })
        return channel;
    };

    variable.prototype.bind = function(f) {
        var result = new variable();
        var dispose = function() {};
        this.onEvent(variable.handler({
            set: function(e) {
                dispose();
                dispose = f(e).onEvent(variable.handler(result));
            },
            unset: function(){
                dispose();
                dispose = function() {};
                result.unset();
            }
        }));
        return result;
    };

    // TOREVIEW

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

    variable.handler = function(handler) {
        return function(e) {
            if (e[0]==="set") {
                handler.set(e[1]);
            } else if (e[0]==="unset") {
                handler.unset();
            } else {
                throw new Error("Unknown event: " + e[0]);
            }
        };
    };

    return variable;
});
