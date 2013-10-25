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
    this.handler = null;
    this.list = list;
    this.Reducer = Reducer;

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
            this.unsubscribe = new ImmediatelyDisposableSubscribe(this.list).onEvent(List.handler({
                data: function(data) {
                    if (this.reducer!=null) {
                        this.reducer.dispose();
                        this.reducer = null;
                    }
                    this.reducer = new this.Reducer(this.cellId, this._monoid, this._wrap, this._ignoreUnset, function(e){
                        if (e[0]=="set") {
                            this.content = new Some(this._unwrap(e[1]));
                        } else if (e[0]=="unset") {
                            this.content = new None();
                        } else {
                            throw new Error();
                        }
                        this.raise();
                    }.bind(this));
                    this.reducer.init(data);
                }.bind(this),
                add: function(item) {
                    this.reducer.add(item.key, item.value);
                }.bind(this),
                remove: function(key) {
                    this.reducer.remove(key);
                }.bind(this)
            }));
        }
    };

    ReducedList.prototype.leave = function(id) {
        BaseCell.prototype.leave.apply(this, [id]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;

            this.reducer.dispose();
            this.reducer = null;

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


function ImmediatelyDisposableSubscribe(subscribable) {
    var self = this;
    this.isActive = true;
    this.onEvent = function(f) {
        var dispose = subscribable.onEvent(function(e){
            if (!self.isActive) return;
            f(e);
        });
        return function() {
            self.isActive = false;
            dispose();
        }
    };
}