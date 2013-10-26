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
    this.alternative = opt.alternative;
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
                        value = {value: this.transform(value)};
                    } else if (this.alternative != null) {
                        value = {value: this.alternative(value)};
                    } else {
                        value = null;
                    }

                    if (value != null) {
                        if (!isEmpty(this) && this.content.value()===value.value) return;
                        this.content = new Some(value.value);
                    } else {
                        if (isEmpty(this)) return;
                        this.content = new None();
                    }
                    this.raise();
                }.bind(this),
                unset: function(){
                    if (this.content != null && this.content.isEmpty()) return;
                    this.content = new None();
                    this.raise();
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

    function isEmpty(self) {
        if (self.content === null) return true;
        return self.content.isEmpty();
    }
}