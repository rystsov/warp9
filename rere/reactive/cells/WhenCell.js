expose(WhenCell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    Cell = root.reactive.Cell;
    BaseCell = root.reactive.cells.BaseCell;

    SetWhenPrototype();
});

var None, Some, Cell, BaseCell;

function WhenCell(source, opt) {
    this.source = source;
    this.condition = opt.condition;
    this.transform = opt.transform;
    this.alternative = opt.hasOwnProperty("alternative") ? new Some(opt.alternative) : new None();
    BaseCell.apply(this);
}

function SetWhenPrototype() {
    WhenCell.prototype = new BaseCell();

    WhenCell.prototype.use = function(id) {
        BaseCell.prototype.use.apply(this, [id]);
        if (this.usersCount === 1) {
            this.source.use(this.cellId);
            this.unsubscribe = this.source.onEvent(Cell.handler({
                set: function(value) {
                    if (this.condition(value)) {
                        this.content = new Some(this.transform(value));
                        this.raise(["set", this.content.value()]);
                    } else if (!this.alternative.isEmpty()) {
                        this.raise(["set", this.alternative.value()]);
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