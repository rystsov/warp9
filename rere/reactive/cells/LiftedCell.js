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

    LiftedCell.prototype.use = function(id) {
        BaseCell.prototype.use.apply(this, [id]);
        if (this.usersCount === 1) {
            this.source.use(this.cellId);
            this.unsubscribe = this.source.onEvent(Cell.handler({
                set: function(value) {
                    this.content = new Some(this.f(value));
                    this.raise(["set", this.content.value()]);
                }.bind(this),
                unset: function(){
                    this.content = new None();
                    this.raise(["unset"]);
                }.bind(this)
            }))
        }
    };

    LiftedCell.prototype.leave = function(id) {
        BaseCell.prototype.leave.apply(this, [id]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.leave(this.cellId);
        }
    };

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
}