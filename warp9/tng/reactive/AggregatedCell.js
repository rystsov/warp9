expose(AggregatedCell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    BaseCell = root.tng.reactive.BaseCell;
    List = root.tng.reactive.lists.List;
    DAG = root.tng.dag.DAG;
    event_broker = root.tng.event_broker;
    tracker = root.tng.tracker;

    SetPrototype();
});

var DAG, None, Some, BaseCell, List, event_broker, tracker;

function AggregatedCell(list, Reducer, algebraicStructure, wrap, unwrap, ignoreUnset) {
    BaseCell.apply(this);
    this.attach(AggregatedCell);

    this.handler = null;
    this.list = list;
    this.Reducer = Reducer;

    this.itemIdToNodeId = {};
    this.nodeIdToItemIds = {};
    this.dependencies = {};
    this.reducer = null;

    this._monoid = algebraicStructure;
    this._wrap = wrap;
    this._unwrap = unwrap;
    this._ignoreUnset = ignoreUnset;
}


function SetPrototype() {
    AggregatedCell.prototype = new BaseCell();


    AggregatedCell.prototype.dependenciesChanged = function() {
        for (var nodeId in this.changed) {
            if (!this.changed.hasOwnProperty(nodeId)) continue;
            if (!this.dependencies.hasOwnProperty(nodeId)) {
                throw new Error();
            }
            if (!this.nodeIdToItemIds.hasOwnProperty(nodeId)) {
                throw new Error();
            }
            for (var j=0;j<this.nodeIdToItemIds[nodeId].length;j++) {
                var itemId = this.nodeIdToItemIds[nodeId][j];
                this.reducer.update(itemId, this.dependencies[nodeId].content);
            }
        }

        this.changed = {};

        var value = this.reducer.value.lift(this._unwrap);
        if (!value.isEqualTo(this.content)) {
            this.content = value;
            return true;
        }
        return false;
    };

    AggregatedCell.prototype.leak = function(id) {
        id = arguments.length==0 ? this.nodeId : id;

        if (!event_broker.isOnProcessCall) {
            event_broker.invokeOnProcess(this, this.leak, [id]);
            return;
        }

        BaseCell.prototype._leak.apply(this, [id]);

        if (this.usersCount === 1) {
            this.list.leak(this.nodeId);
            DAG.addNode(this);
            this.unsubscribe = this.list.onEvent(List.handler({
                data: function(data) {
                    this._dispose();
                    this.reducer = new this.Reducer(this._monoid, this._wrap, this._ignoreUnset);
                    for (var i=0;i<data.length;i++) {
                        this._addItem(data[i].key, data[i].value);
                    }
                    this.content = this._unwrap(this.reducer.value);
                    event_broker.emitChanged(this);
                }.bind(this),
                add: function(item) {
                    this._addItem(item.key, item.value);
                    var value = this.reducer.value.lift(this._unwrap);
                    if (!value.isEqualTo(this.content)) {
                        this.content = value;
                        event_broker.emitChanged(this);
                    }
                }.bind(this),
                remove: function(key) {
                    this._removeItem(key);
                    var value = this.reducer.value.lift(this._unwrap);
                    if (!value.isEqualTo(this.content)) {
                        this.content = value;
                        event_broker.emitChanged(this);
                    }
                }.bind(this)
            }));
        }
    };

    AggregatedCell.prototype.seal = function(id) {
        id = arguments.length==0 ? this.nodeId : id;
        BaseCell.prototype.seal.apply(this, [id]);

        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;

            this.dispose();

            this.list.seal(this.nodeId);
            DAG.removeNode(this);
        }
    };


    AggregatedCell.prototype._dispose = function() {
        for (var nodeId in this.dependencies) {
            if (!this.dependencies.hasOwnProperty(nodeId)) continue;
            DAG.removeRelation(this.dependencies[nodeId], this);
            this.dependencies[nodeId].seal(this.nodeId);
        }
        this.itemIdToNodeId = {};
        this.nodeIdToItemIds = {};
        this.dependencies = {};
        this.reducer = null;
        this.content = null;
    };

    AggregatedCell.prototype._addItem = function(key, value) {
        if (value.instanceof(BaseCell)) {
            if (this.itemIdToNodeId.hasOwnProperty(key)) {
                throw new Error();
            }
            this.itemIdToNodeId[key] = value.nodeId;
            if (!this.nodeIdToItemIds.hasOwnProperty(value.nodeId)) {
                this.nodeIdToItemIds[value.nodeId] = [];
            }
            this.nodeIdToItemIds[value.nodeId].push(key);

            if (this.nodeIdToItemIds[value.nodeId].length==1) {
                this.dependencies[value.nodeId] = value;
                value.leak(this.nodeId);
                DAG.addRelation(value, this);
            }

            this.reducer.add(key, value.content);
        } else {
            this.reducer.add(key, new Some(value));
        }
    };

    AggregatedCell.prototype._removeItem = function(key) {
        this.reducer.remove(key);
        if (this.itemIdToNodeId.hasOwnProperty(key)) {
            var nodeId = this.itemIdToNodeId[key];
            if (!this.nodeIdToItemIds.hasOwnProperty(nodeId)) {
                throw new Error();
            }
            this.nodeIdToItemIds[nodeId] = this.nodeIdToItemIds[nodeId].filter(function(item){
                return item != key;
            });
            if (this.nodeIdToItemIds[nodeId].length==0) {
                var node = this.dependencies[nodeId];
                DAG.removeRelation(node, this);
                node.seal(this.nodeId);
                delete this.dependencies[nodeId];
                delete this.nodeIdToItemIds[nodeId];
            }
        }
        delete this.itemIdToNodeId[key];
    };

    AggregatedCell.prototype.hasValue = function() {
        if (this.usersCount==0) throw new Error();

        tracker.track(this);
        return !this.content.isEmpty();
    };

    AggregatedCell.prototype.unwrap = function(alt) {
        if (this.usersCount==0) throw new Error();

        tracker.track(this);
        if (arguments.length==0 && this.content.isEmpty()) {
            throw new EmptyError();
        }
        return this.content.isEmpty() ? alt : this.content.value();
    };

//    AggregatedCell.prototype.unwrap = function() {
//        var blocked = false;
//        var data = this.list.unwrap().map(function(value){
//            if (typeof value === "object" && value.type === Cell) {
//                var marker = {};
//                value = value.unwrap(marker);
//                if (marker===value) {
//                    blocked = true;
//                    return this._monoid.identity();
//                }
//                return value;
//            }
//            return value;
//        }.bind(this));
//        if (!this._ignoreUnset && blocked) {
//            if (arguments.length === 0) throw new Error();
//            return arguments[0];
//        }
//
//        var sum = this._monoid.identity();
//        data.forEach(function(item){
//            sum = this._monoid.add(sum, this._wrap(item));
//        }.bind(this));
//        return this._unwrap(sum);
//    };
}
