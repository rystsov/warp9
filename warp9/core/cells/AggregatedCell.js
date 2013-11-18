expose(AggregatedCell, function(){
    None = root.core.adt.maybe.None;
    Some = root.core.adt.maybe.Some;
    BaseCell = root.core.cells.BaseCell;
    List = root.core.lists.List;
    DAG = root.core.dag.DAG;
    event_broker = root.core.event_broker;
    tracker = root.core.tracker;
    Matter = root.core.Matter;

    SetPrototype();
});

var DAG, None, Some, BaseCell, List, Matter, event_broker, tracker;

function AggregatedCell(list, Reducer, algebraicStructure, wrap, unwrap, ignoreUnset) {
    BaseCell.apply(this);
    this.attach(AggregatedCell);

    this.list = list;
    this.Reducer = Reducer;

    this.itemIdToNodeId = {};
    this.nodeIdToItemIds = {};
    this.dependencies = {};
    this.reducer = null;
    this.content = null;

    this._monoid = algebraicStructure;
    this._wrap = wrap;
    this._unwrap = unwrap;
    this._ignoreUnset = ignoreUnset;
}


function SetPrototype() {
    AggregatedCell.prototype = new BaseCell();

    // dependenciesChanged is being called during propagating only (!)

    AggregatedCell.prototype.dependenciesChanged = function() {
        // guard
        for (var nodeId in this.changed) {
            if (!this.changed.hasOwnProperty(nodeId)) continue;
            if (nodeId == this.list.nodeId) continue;
            if (!this.dependencies.hasOwnProperty(nodeId)) {
                throw new Error();
            }
            if (!this.nodeIdToItemIds.hasOwnProperty(nodeId)) {
                throw new Error();
            }
        }

        if (this.changed.hasOwnProperty(this.list.nodeId)) {
            for (var i=0;i<this.changed[this.list.nodeId].length;i++) {
                var change = this.changed[this.list.nodeId][i];
                if (change[0]=="reset") {
                    var data = change[1];
                    this._dispose();
                    this.reducer = new this.Reducer(this._monoid, this._wrap, this._ignoreUnset);
                    for (var j=0;j<data.length;j++) {
                        this._addItem(data[j].key, data[j].value);
                    }
                } else if (change[0]=="add") {
                    var item = change[1];
                    this._addItem(item.key, item.value);
                } else if (change[0]=="remove") {
                    var key = change[1];
                    this._removeItem(key);
                } else {
                    throw new Error("Unknown event: " + change[0]);
                }
            }
            delete this.changed[this.list.nodeId];
        }

        for (var nodeId in this.changed) {
            if (!this.changed.hasOwnProperty(nodeId)) continue;
            if (!this.dependencies.hasOwnProperty(nodeId)) {
                continue;
            }
            if (!this.nodeIdToItemIds.hasOwnProperty(nodeId)) {
                continue;
            }

            for (var i=0;i<this.changed[nodeId].length;i++) {
                var change = this.changed[nodeId][i];
                for (var j=0;j<this.nodeIdToItemIds[nodeId].length;j++) {
                    var itemId = this.nodeIdToItemIds[nodeId][j];
                    this.reducer.update(itemId, change);
                }
            }
        }

        this.changed = {};

        var value = this.reducer.value.lift(this._unwrap);
        if (value.isEqualTo(this.content)) {
            return { hasChanges: false };
        }
        this.content = value;
        this._putEventToDependants(this.content.isEmpty() ? ["unset"] : ["set", this.content.value()]);
        event_broker.notify(this);

        return {
            hasChanges: true,
            changeSet: [this.content]
        };
    };

    // _leak & _seal are called only by onChange

    AggregatedCell.prototype._leak = function(id) {
        BaseCell.prototype._leak.apply(this, [id]);

        if (this.usersCount === 1) {
            DAG.addNode(this);
            this.list._leak(this.nodeId);
            DAG.addRelation(this.list, this);

            this.reducer = new this.Reducer(this._monoid, this._wrap, this._ignoreUnset);
            for (var j=0;j<this.list.data.length;j++) {
                this._addItem(this.list.data[j].key, this.list.data[j].value);
            }
            this.content = this.reducer.value.lift(this._unwrap);
        }
    };

    AggregatedCell.prototype._seal = function(id) {
        id = arguments.length==0 ? this.nodeId : id;
        BaseCell.prototype._seal.apply(this, [id]);

        if (this.usersCount === 0) {
            this._dispose();
            DAG.removeRelation(this.list, this);
            this.list._seal(this.nodeId);
            DAG.removeNode(this);
            this.content = null;
        }
    };

    // gets

    AggregatedCell.prototype.hasValue = function() {
        var marker = {};
        return this.unwrap(marker) !== marker;
    };

    AggregatedCell.prototype.unwrap = function(alt) {
        tracker.track(this);

        var value = this.content;
        if (this.usersCount===0) {
            var reducer = new this.Reducer(this._monoid, this._wrap, this._ignoreUnset);
            var data = this.list.unwrap();
            var marker = {};
            var id = 0;
            for (var i=0;i<data.length;i++) {
                if (data[i].metaType === Matter && data[i].instanceof(BaseCell)) {
                    var item = data[i].unwrap(marker);
                    if (item===marker) {
                        reducer.add(id++, new None());
                    } else {
                        reducer.add(id++, new Some(item));
                    }
                } else {
                    reducer.add(id++, new Some(data[i]));
                }
            }
            value = reducer.value;
        }
        return value.unwrap.apply(value, arguments);
    };

    // internal

    AggregatedCell.prototype._dispose = function() {
        for (var nodeId in this.dependencies) {
            if (!this.dependencies.hasOwnProperty(nodeId)) continue;
            DAG.removeRelation(this.dependencies[nodeId], this);
            this.dependencies[nodeId]._seal(this.nodeId);
        }
        this.itemIdToNodeId = {};
        this.nodeIdToItemIds = {};
        this.dependencies = {};
        this.reducer = null;
        this.content = null;
    };

    AggregatedCell.prototype._addItem = function(key, value) {
        if (value.metaType === Matter && value.instanceof(BaseCell)) {
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
                value._leak(this.nodeId);
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
                node._seal(this.nodeId);
                delete this.dependencies[nodeId];
                delete this.nodeIdToItemIds[nodeId];
            }
        }
        delete this.itemIdToNodeId[key];
    };
}
