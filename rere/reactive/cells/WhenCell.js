expose(WhenCell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    Cell = root.reactive.Cell;
    BaseCell = root.reactive.cells.BaseCell;

    SetWhenPrototype();
});

var None, Some, Cell, BaseCell;

function WhenCell(source, condition, transform) {
    this.source = source;
    this.condition = condition;
    this.transform = transform;
    BaseCell.apply(this);
}

function SetWhenPrototype() {
    WhenCell.prototype = new BaseCell();

    WhenCell.prototype.onEvent = function(f) {
        if (this.usersCount>0) {
            if (this.content.isEmpty()) {
                f(["unset"]);
            } else {
                f(["set", this.content.value()]);
            }
        }
        return BaseCell.prototype.onEvent.apply(this, [f]);
    };

    WhenCell.prototype.use = function(id) {
        BaseCell.prototype.use.apply(this, [id]);
        if (this.usersCount === 1) {
            this.source.use(this.cellId);
            this.unsubscribe = this.source.onEvent(Cell.handler({
                set: function(value) {
                    if (this.condition(value)) {
                        this.content = new Some(this.transform(value));
                        this.raise(["set", this.content.value()]);
                    } else {
                        this.content = new None();
                        this.raise(["unset"]);
                    }
                }.bind(this),
                unset: function(){
                    this.content = new None();
                    this.raise(["unset"]);
                }.bind(this)
            }))
        }
    };

    WhenCell.prototype.leave = function(id) {
        BaseCell.prototype.leave.apply(this, [id]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.leave(this.cellId);
        }
    };

    WhenCell.prototype.unwrap = function() {
        var marker = {};
        var value = this.source.unwrap(marker);
        if (value !== marker) {
            if (this.condition(value)) {
                return this.transform(value);
            }
        }
        if (arguments.length === 0) throw new Error();
        return arguments[0];
    };
}