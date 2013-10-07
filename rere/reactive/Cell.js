expose(Cell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    BaseCell = root.reactive.cells.BaseCell;

    SetCellPrototype();
});


// pull by default (unwrap)
// subscribe (onEvent) doesn't activate (switch to push) cell

var Some, None, BaseCell;

function Cell() {
    BaseCell.apply(this, []);

    this.content = new None();
    if (arguments.length>0) {
        this.set(arguments[0])
    }
}

function SetCellPrototype() {
    Cell.prototype = new BaseCell();

    // Common
    Cell.prototype.onEvent = function(f) {
        if (this.content.isEmpty()) {
            f(["unset"]);
        } else {
            f(["set", this.content.value()]);
        }
        return BaseCell.prototype.onEvent.apply(this, [f]);
    };

    Cell.prototype.unwrap = function(alt) {
        if (arguments.length==0 && this.content.isEmpty()) throw new Error();
        return this.content.isEmpty() ? alt : this.content.value();
    };

    // Specific
    Cell.prototype.set = function(value) {
        this.content = new Some(value)
        this.raise(["set", value])
    };

    Cell.prototype.unset = function() {
        this.content = new None();
        this.raise(["unset"])
    };

    Cell.prototype.raise = function(e) {
        this.dependants.forEach(function(d){ d.f(e); });
    };
}

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



/*
var maybe = root.adt.maybe;

var id = 0;

function Cell() {
    var dependantsId = 0;

    this.id = id++;

    // used in garbage collection
    this.isActive = true;

    this.type = Cell;
    this.content = new maybe.None();
    this.dependants   = [];
    this.dependanties = [];
}

Cell.prototype.when = function(condition, value) {
    var self = this;

    var test = typeof condition === "function" ? condition : function(value) {
        return value === condition;
    };

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
            if (e[0]==="set") {
                if (test(e[1])) {
                    channel.set(value);
                } else {
                    channel.unset();
                }
            } else if (e[0]==="unset") {
                channel.unset();
            } else {
                throw new Error();
            }
        }, forget);
    };
    channel.activate();

    return channel;
};

    Cell.prototype.coalesce = function(value) {
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
                if (e[0]==="set") {
                    channel.set(e[1]);
                } else if (e[0]==="unset") {
                    channel.set(value);
                } else {
                    throw new Error();
                }
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
*/