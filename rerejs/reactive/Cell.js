expose(Cell);

var maybe = root.adt.maybe;

var id = 0;

function Cell() {
    var dependantsId = 0;

    this.id = id++;

    // used in garbage collection
    this.isActive = true;
    this.users = [];
    this.addUser = function(userId) {
        if (this.users.indexOf(userId)>=0) throw new Error();
        this.users.push(userId);
    };
    this.hasUsers = function() {
        return this.users.length>0;
    };
    this.hasUser = function(userId) {
        return this.users.indexOf(userId)>=0;
    };
    this.removeUser = function(userId) {
        if (this.users.indexOf(userId)<0) throw new Error();
        this.users = this.users.filter(function(item){ return item != userId });
        if (this.users.indexOf(userId)>=0) throw new Error();
    };
    this.isGarbage = false;

    this.type = Cell;
    this.content = new maybe.None();
    this.dependants   = [];
    this.dependanties = [];

    // used in debug propose only
    this.name = function() {
        if (arguments.length==0) {
            if (this._name) {
                return this.id + "(" + this._name + ")";
            }
            return this.id;
        }
        this._name = arguments[0];
        return this;
    };

    this.activate = function() {
        if (this.isActive) return;
        throw new Error();
    }

    this.subscribe = function(f) {
        return this.onEvent([], function(e){
            if (e[0]==="set") {
                f(e[1]);
            }
        });
    };

    // unsubscribe is called by GC, when it wants to uncut refs to dependants (if they all are garbage)
    // unsubscribe expects function that will remove dependant record from this.dependants
    // unsubscribe is never called if dependants is empty
    this.onEvent = function(dependants, f, unsubscribe) {
        var self = this;
        unsubscribe = unsubscribe || function(f) {
            f();
        };
        var id = dependantsId++;
        this.dependants.push({key: id, dependants: dependants, f:f, unsubscribe: unsubscribe});
        if (this.content.isEmpty()) {
            f(["unset"]);
        } else {
            f(["set", this.content.value()]);
        }
        return function() {
            self.dependants = self.dependants.filter(function(dependant) {
                return dependant.key!=id;
            });
        };
    };

    this.set = function(value) {
        this.content = new maybe.Some(value)
        Cell.raise(this, ["set", value])
    };
    this.unset = function() {
        this.content = new maybe.None();
        Cell.raise(this, ["unset"])
    };

    if (arguments.length>0) {
        this.set(arguments[0])
    }
}

Cell.prototype.unwrap = function(alt) {
    if (arguments.length==0 && this.content.isEmpty()) throw new Error();
    return this.content.isEmpty() ? alt : this.content.value();
};

Cell.prototype.lift = function(f) {
    var self = this;

    var channel = new Cell()
    var forget = function(unsubscribe) {
        channel.isActive = false;
        channel.dependanties = [];
        unsubscribe();
    };
    channel.isActive = false;
    channel.activate = function() {
        if (this.isActive) return;
        self.activate();
        channel.isActive = true;
        channel.dependanties = [self];
        self.onEvent([channel], function(e){
            Cell.replay(channel, e, f);
        }, forget);
    };
    channel.activate();

    return channel;
};

Cell.prototype.bind = function(f) {
    var self = this;

    var result = new Cell();
    var dispose = function() {};
    var forget = function(unsubscribe) {
        dispose();
        result.isActive = false;
        result.dependanties = [];
        unsubscribe();
    };
    result.isActive = false;
    result.activate = function() {
        if (this.isActive) return;
        self.activate();
        result.isActive = true;
        result.dependanties = [self];
        self.onEvent([result], Cell.handler({
            set: function(e) {
                dispose();
                var leader = f(e);
                leader.activate();
                result.dependanties = [self, leader];
                dispose = leader.onEvent([result], Cell.handler(result));
            },
            unset: function(){
                dispose();
                result.dependanties = [self];
                dispose = function() {};
                result.unset();
            }
        }), forget);
    };
    result.activate();
    return result;
};

Cell.raise = function(self, e) {
    for (var i in self.dependants) {
        var f = self.dependants[i].f;
        f(e);
    }
};

Cell.replay = function (self, e, f) {
    if (e[0]==="set") {
        self.set(f(e[1]));
    } else if (e[0]==="unset") {
        self.unset()
    } else {
        throw new Error();
    }
};

Cell.handler = function(handler) {
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
