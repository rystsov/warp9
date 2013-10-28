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

    WhenCell.prototype.unwrap = function() {
        var marker = {};
        var value = this.source.unwrap(marker);
        if (value !== marker) {
            if (this.condition(value)) {
                if (this.transform != null) {
                    value = {value: this.transform(value)};
                } else {
                    value = {value: value};
                }
            } else {
                if (this.alternative != null) {
                    value = {value: this.alternative(value)};
                } else {
                    value = null;
                }
            }
        } else {
            value = null;
        }
        if (value==null) {
            if (arguments.length == 0) throw new Error();
            return arguments[0];
        }
        return value.value;
    };

    var knownEvents = {
        use: "_use",
        leave: "_leave"
    };

    WhenCell.prototype.send = function(event) {
        if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
        if (knownEvents.hasOwnProperty(event.name)) {
            this[knownEvents[event.name]].apply(this, [event]);
        } else {
            BaseCell.prototype.send.apply(this, [event]);
        }
    };

    WhenCell.prototype._use = function(event) {
        BaseCell.prototype._use.apply(this, [event]);
        if (this.usersCount === 1) {
            this.source.use(this.cellId);
            this.unsubscribe = this.source.onEvent(Cell.handler({
                set: function(value) {
                    if (this.condition(value)) {
                        if (this.transform != null) {
                            value = {value: this.transform(value)};
                        } else {
                            value = {value: value};
                        }
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
                    this.__raise();
                }.bind(this),
                unset: function(){
                    if (this.content != null && this.content.isEmpty()) return;
                    this.content = new None();
                    this.__raise();
                }.bind(this)
            }))
        }
    };

    WhenCell.prototype._leave = function(event) {
        BaseCell.prototype._leave.apply(this, [event]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.leave(this.cellId);
        }
    };

    function isEmpty(self) {
        if (self.content === null) return true;
        return self.content.isEmpty();
    }
}