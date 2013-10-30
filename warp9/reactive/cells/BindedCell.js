expose(BindedCell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    Cell = root.reactive.Cell;
    BaseCell = root.reactive.cells.BaseCell;

    SetBindedPrototype();
});

var None, Some, Cell, BaseCell;

function empty() {}

function BindedCell(source, f) {
    this.source = source;
    this.f = f;
    this.mapped = null;
    this.unmap = empty;
    BaseCell.apply(this);
}

function SetBindedPrototype() {
    BindedCell.prototype = new BaseCell();

    BindedCell.prototype.unwrap = function() {
        var marker = {};
        var value = this.source.unwrap(marker);
        if (value !== marker) {
            var mapped = this.f(value);
            value = mapped.unwrap(marker);
            if (value !== marker) {
                return value;
            }
        }
        if (arguments.length === 0) throw new Error();
        return arguments[0];
    };

    var knownEvents = {
        leak: "_leak",
        leave: "_leave"
    };

    BindedCell.prototype.send = function(event) {
        if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
        if (knownEvents.hasOwnProperty(event.name)) {
            this[knownEvents[event.name]].apply(this, [event]);
        } else {
            BaseCell.prototype.send.apply(this, [event]);
        }
    };

    BindedCell.prototype._leak = function(event) {
        BaseCell.prototype._leak.apply(this, [event]);
        if (this.usersCount === 1) {
            this.source.leak(this.cellId);
            this.unsource = this.source.onEvent(Cell.handler({
                set: function(value) {
                    this.unmap();
                    this.mapped = this.f(value);
                    if (this.source == this.mapped) {
                        throw new Error();
                    }
                    this.mapped.leak(this.cellId);
                    var dispose = this.mapped.onEvent(Cell.handler({
                        set: function(value) {
                            this.content = new Some(value);
                            this.__raise();
                        }.bind(this),
                        unset: function() {
                            this.content = new None();
                            this.__raise();
                        }.bind(this)
                    }));
                    this.unmap = function(){
                        dispose();
                        this.mapped.leave(this.cellId);
                        this.mapped = null;
                        this.unmap = empty;
                    }.bind(this);
                }.bind(this),
                unset: function(){
                    this.unmap();
                    this.content = new None();
                    this.__raise();
                }.bind(this)
            }));
        }
    };

    BindedCell.prototype._leave = function(event) {
        BaseCell.prototype._leave.apply(this, [event]);
        if (this.usersCount === 0) {
            this.unsource();
            this.unmap();
            this.unsource = null;
            this.content = null;
            this.source.leave(this.cellId);
        }
    };
}