expose(LiftedCell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    Cell = root.reactive.Cell;
    BaseCell = root.reactive.cells.BaseCell;

    SetLiftedPrototype();
});

var None, Some, Cell, BaseCell;

function LiftedCell(source, f) {
    this.source = source;
    this.f = f;
    BaseCell.apply(this);
}

function SetLiftedPrototype() {
    LiftedCell.prototype = new BaseCell();

    LiftedCell.prototype.unwrap = function() {
        var marker = {};
        var value = this.source.unwrap(marker);
        if (value !== marker) {
            return this.f(value);
        } else {
            if (arguments.length === 0) throw new Error();
            return arguments[0];
        }
    };

    var knownEvents = {
        leak: "_leak",
        leave: "_leave"
    };

    LiftedCell.prototype.send = function(event) {
        if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
        if (knownEvents.hasOwnProperty(event.name)) {
            this[knownEvents[event.name]].apply(this, [event]);
        } else {
            BaseCell.prototype.send.apply(this, [event]);
        }
    };

    LiftedCell.prototype._leak = function(event) {
        BaseCell.prototype._leak.apply(this, [event]);

        if (this.usersCount === 1) {
            this.source.leak(this.cellId);
            this.unsubscribe = this.source.onEvent(Cell.handler({
                set: function(value) {
                    this.content = new Some(this.f(value));
                    this.__raise();
                }.bind(this),
                unset: function(){
                    this.content = new None();
                    this.__raise();
                }.bind(this)
            }))
        }
    };

    LiftedCell.prototype._leave = function(event) {
        BaseCell.prototype._leave.apply(this, [event]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.leave(this.cellId);
        }
    };
}