define([], function() {
return function(rere) {

var maybe = rere.adt.maybe;

function variable() {
    this["rere/reactive/Channel"] = true;
    this["rere/reactive/Variable"] = true;
    this["rere/reactive/Channel/dependants"] = [];
    this["rere/reactive/Channel/dependants/id"] = 0;
    this["rere/reactive/Variable/value"] = new maybe.None();
    this["rere/reactive/Channel/on/dispose"] = [];

    this.T = variable;
    this.subscribe = function(f) {
        return this.onEvent(function(e){
            if (e[0]==="set") {
                f(e[1]);
            }
        });
    };
    this.onDispose = function(f) {
        this["rere/reactive/Channel/on/dispose"].push(f);
    };
    this.dispose = function() {
        this["rere/reactive/Channel/on/dispose"].map(function(f){
            f();
        });
    }
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
        };
    };
    this.value = function() {
        return this["rere/reactive/Variable/value"]
    };
    this.raise = function(value) {
        this["rere/reactive/Variable/value"] = new maybe.Some(value)
        variable.raise(this, ["set", value])
    };
    this.follows = function() {
        var self = this;
        var what = arguments[0];
        var how = arguments.length>1 ? arguments[1] : function(x) { return x; };
        var dispose = what.onEvent(function(e){
            variable.replay(self, e, how);
        });
        self.onDispose(dispose);
        return dispose;
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

variable.prototype.clone = function(f) {
    var result = new variable();
    result.follows(this);
    return result;
};

variable.prototype.unwrap = function(alt) {
    if (arguments.length==0 && this.value().isempty()) throw new Error();
    return this.value().isempty() ? alt : this.value().value();
};

variable.prototype.lift = function(f) {
    var channel = new this.T();
    channel.onDispose(this.onEvent(function(e){
        variable.replay(channel, e, f);
    }));
    return channel;
};

variable.prototype.patch = function(f) {
    if (this.value().isempty()) return;
    // TODO: via set
    f(this.value().value());
};

variable.prototype.bind = function(f) {
    var result = new variable();
    var dispose = function() {};
    result.onDispose(this.onEvent(variable.handler({
        set: function(e) {
            dispose();
            dispose = f(e).onEvent(variable.handler(result));
        },
        unset: function(){
            dispose();
            dispose = function() {};
            result.unset();
        }
    })));
    result.onDispose(dispose);
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

};
});
