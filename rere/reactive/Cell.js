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

    if (arguments.length>0) {
        this.content = new Some(arguments[0]);
    } else {
        this.content = new None();
    }
}

function SetCellPrototype() {
    Cell.prototype = new BaseCell();

    Cell.prototype.unwrap = function(alt) {
        if (arguments.length==0 && this.content.isEmpty()) {
            throw new Error();
        }
        return this.content.isEmpty() ? alt : this.content.value();
    };

    // Specific
    Cell.prototype.set = function(value) {
        // TODO: do not set if equal
        root.reactive.event_broker.issue(this, {
            name: "set",
            value: value
        });
    };

    Cell.prototype.unset = function() {
        root.reactive.event_broker.issue(this, {
            name: "unset"
        });
    };

    var knownEvents = {
        use: "_use",
        set: "_set",
        unset: "_unset"
    };

    Cell.prototype.send = function(event) {
        if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
        if (knownEvents.hasOwnProperty(event.name)) {
            this[knownEvents[event.name]].apply(this, [event]);
        } else {
            BaseCell.prototype.send.apply(this, [event]);
        }
    };

    Cell.prototype._use = function(event) {
        BaseCell.prototype._use.apply(this, [event]);
        if (this.usersCount === 1) {
            this.__raise();
        }
    };

    Cell.prototype._set = function(event) {
        if (event.name!="set") throw new Error();
        this.content = new Some(event.value);
        this.__raise();
    };

    Cell.prototype._unset = function(event) {
        if (event.name!="unset") throw new Error();
        this.content = new None();
        this.__raise()
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
