expose(ReducedList, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    Cell = root.reactive.Cell;
    List = root.reactive.List;
    BaseCell = root.reactive.cells.BaseCell;

    SetPrototype();
});

var None, Some, Cell, BaseCell, List;

function ReducedList(list, Reducer, algebraicStructure, wrap, unwrap, ignoreUnset) {
    BaseCell.apply(this);
    this.list = list;
    this.reducer = new Reducer(this.cellId, algebraicStructure, wrap, ignoreUnset);
    this.reducer.set = function(value) {
        if (this.usersCount===0) throw new Error();
        this.content = new Some(this._unwrap(value));
        this.raise();
    }.bind(this);
    this.reducer.unset = function() {
        if (this.usersCount===0) throw new Error();
        this.content = new None();
        this.raise();
    }.bind(this);
    this._monoid = algebraicStructure;
    this._unwrap = unwrap;
    this._wrap = wrap;
    this._ignoreUnset = ignoreUnset;
}

function SetPrototype() {
    ReducedList.prototype = new BaseCell();

    ReducedList.prototype.use = function(id) {
        BaseCell.prototype.use.apply(this, [id]);
        if (this.usersCount === 1) {
            this.list.use(this.cellId);
            this.unsubscribe = this.list.onEvent(List.handler({
                data: function(data) {
                    this.reducer.dispose();
                    this.reducer.init(data);
                }.bind(this),
                add: function(item) {
                    this.reducer.add(item.key, item.value);
                }.bind(this),
                remove: function(key) {
                    this.reducer.remove(key);
                }.bind(this)
            }))
        }
    };

    ReducedList.prototype.leave = function(id) {
        BaseCell.prototype.leave.apply(this, [id]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.reducer.dispose();
            this.list.leave(this.cellId);
        }
    };

    ReducedList.prototype.unwrap = function() {
        var blocked = false;
        var data = this.list.unwrap().map(function(value){
            if (typeof value === "object" && value.type === Cell) {
                var marker = {};
                value = value.unwrap(marker);
                if (marker===value) {
                    blocked = true;
                    return this._monoid.identity();
                }
                return value;
            }
            return value;
        }.bind(this));
        if (!this._ignoreUnset && blocked) {
            if (arguments.length === 0) throw new Error();
            return arguments[0];
        }
        
        var sum = this._monoid.identity();
        data.forEach(function(item){
            sum = this._monoid.add(sum, this._wrap(item));
        }.bind(this));
        return this._unwrap(sum);
    };
}
