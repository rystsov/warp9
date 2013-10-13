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

    CoalesceCell.prototype.use = function(id) {
        BaseCell.prototype.use.apply(this, [id]);
        if (this.usersCount === 1) {
            this.source.use(this.cellId);
            this.unsubscribe = this.source.onEvent(Cell.handler({
                set: function(value) {
                    this.content = new Some(value);
                    this.raise(["set", this.content.value()]);
                }.bind(this),
                unset: function(){
                    this.content = new Some(this.replace);
                    this.raise(["set", this.content.value()]);
                }.bind(this)
            }))
        }
    };

    CoalesceCell.prototype.leave = function(id) {
        BaseCell.prototype.leave.apply(this, [id]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.leave(this.cellId);
        }
    };

    CoalesceCell.prototype.unwrap = function() {
        return this.source.unwrap(this.replace);
    };
}