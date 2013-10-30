expose(CoalesceCell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    Cell = root.reactive.Cell;
    BaseCell = root.reactive.cells.BaseCell;

    SetCoalescePrototype();
});

var None, Some, Cell, BaseCell;

function CoalesceCell(source, replace) {
    this.source = source;
    this.replace = replace;
    BaseCell.apply(this);
}

function SetCoalescePrototype() {
    CoalesceCell.prototype = new BaseCell();

    CoalesceCell.prototype.unwrap = function() {
        return this.source.unwrap(this.replace);
    };

    var knownEvents = {
        leak: "_leak",
        seal: "_seal"
    };

    CoalesceCell.prototype.send = function(event) {
        if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
        if (knownEvents.hasOwnProperty(event.name)) {
            this[knownEvents[event.name]].apply(this, [event]);
        } else {
            BaseCell.prototype.send.apply(this, [event]);
        }
    };

    CoalesceCell.prototype._leak = function(event) {
        BaseCell.prototype._leak.apply(this, [event]);
        if (this.usersCount === 1) {
            this.source.leak(this.cellId);
            this.unsubscribe = this.source.onEvent(Cell.handler({
                set: function(value) {
                    this.content = new Some(value);
                    this.__raise();
                }.bind(this),
                unset: function(){
                    this.content = new Some(this.replace);
                    this.__raise();
                }.bind(this)
            }))
        }
    };

    CoalesceCell.prototype._seal = function(event) {
        BaseCell.prototype._seal.apply(this, [event]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.seal(this.cellId);
        }
    };
}