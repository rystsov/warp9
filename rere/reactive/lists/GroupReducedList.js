expose(GroupReducedList, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    Cell = root.reactive.Cell;
    List = root.reactive.List;
    BaseCell = root.reactive.cells.BaseCell;
    Sigma = root.reactive.algebra.Sigma;


    SetPrototype();
});

var None, Some, Cell, BaseCell, Sigma, List;

function GroupReducedList(list, group, wrap, unwrap, ignoreUnset) {
    BaseCell.apply(this);
    this.list = list;
    this.sigma = new Sigma(this.cellId, group, wrap, ignoreUnset);
    this.sigma.set = function(value) {
        if (this.usersCount===0) throw new Error();
        this.content = new Some(this._unwrap(value));
        this._raise();
    }.bind(this);
    this.sigma.unset = function() {
        if (this.usersCount===0) throw new Error();
        this.content = new None();
        this._raise();
    }.bind(this);
    this._group = group;
    this._unwrap = unwrap;
    this._wrap = wrap;
    this._ignoreUnset = ignoreUnset;
}

function SetPrototype() {
    GroupReducedList.prototype = new BaseCell();

    GroupReducedList.prototype._raise = function() {
        if (this.content.isEmpty()) {
            this.raise(["unset"]);
        } else {
            this.raise(["set", this.content.value()]);
        }
    };

    GroupReducedList.prototype.onEvent = function(f) {
        if (this.usersCount>0) {
            if (this.content.isEmpty()) {
                f(["unset"]);
            } else {
                f(["set", this.content.value()]);
            }
        }
        return BaseCell.prototype.onEvent.apply(this, [f]);
    };

    GroupReducedList.prototype.use = function(id) {
        BaseCell.prototype.use.apply(this, [id]);
        if (this.usersCount === 1) {
            this.list.use(this.cellId);
            this.unsubscribe = this.list.onEvent(List.handler({
                data: function(data) {
                    this.sigma.dispose();
                    this.sigma.init(data);
                }.bind(this),
                add: function(item) {
                    this.sigma.add(item.key, item.value);
                }.bind(this),
                remove: function(key) {
                    this.sigma.remove(key);
                }.bind(this)
            }))
        }
    };

    GroupReducedList.prototype.leave = function(id) {
        BaseCell.prototype.leave.apply(this, [id]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.sigma.dispose();
            this.list.leave(this.cellId);
        }
    };

    GroupReducedList.prototype.unwrap = function() {
        var blocked = false;
        var data = this.list.unwrap().map(function(value){
            if (typeof value === "object" && value.type === Cell) {
                var marker = {};
                value = value.unwrap(marker);
                if (marker===value) {
                    blocked = true;
                    return this._group.identity();
                }
                return value;
            }
            return value;
        }.bind(this));
        if (!this._ignoreUnset && blocked) {
            if (arguments.length === 0) throw new Error();
            return arguments[0];
        }
        
        var sum = this._group.identity();
        data.forEach(function(item){
            sum = this._group.add(sum, this._wrap(item));
        }.bind(this));
        return this._unwrap(sum);
    };
}
