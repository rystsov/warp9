expose(List, function(){
    BaseList = root.tng.reactive.lists.BaseList;
    uid = root.idgenerator;
    event_broker = root.tng.event_broker;
    DAG = root.tng.dag.DAG;

    SetListPrototype();
});

var uid, BaseList, DAG, event_broker;

function List(data) {
    BaseList.apply(this);
    this.attach(List);

    if (data) {
        this.data = data.map(function(item){
            return {
                key: uid(),
                value: item
            }
        });
    }
}

function SetListPrototype() {
    List.prototype = new BaseList();

    // add, remove, setData are being called only outside of propagating

    List.prototype.add = function(f) {
        if (typeof(f) != "function") {
            var item = f;
            f = function(id) { return item; };
        }

        var key = uid();
        var value = {key: key, value: f(key)};

        if (this.usersCount>0) {
            if (!this.delta) {
                this.delta = {
                    root: null,
                    added: [],
                    removed: {}
                }
            }
            this.delta.added.push(value);
            event_broker.emitChanged(this);
        } else {
            if (this.delta != null) {
                throw new Error();
            }
            this.data.push(value);
        }

        return key;
    };

    List.prototype.remove = function(key) {
        if (this.usersCount>0) {
            if (!this.delta) {
                this.delta = {
                    root: null,
                    added: [],
                    removed: {}
                }
            }
            this.delta.removed.push(key);
            event_broker.emitChanged(this);
        } else {
            if (this.delta != null) {
                throw new Error();
            }
            this.data = this.data.filter(function(item) {
                return item.key != key;
            });
        }
    };

    List.prototype.setData = function(data) {
        data = data.map(function(item){
            return {
                key: uid(),
                value: item
            }
        });
        if (this.usersCount>0) {
            this.delta = {
                root: data,
                added: [],
                removed: {}
            };
            event_broker.emitChanged(this);
        } else {
            if (this.delta != null) {
                throw new Error();
            }
            this.data = data;
        }
    };

    // dependenciesChanged, commit & introduced called during propagating only (!)

    List.prototype.dependenciesChanged = function() {
        return this.delta != null;
    };

    List.prototype.commit = function() {
        if (this.delta==null) throw Error();
        var delta = this.delta;
        this.data = this._latest();
        this.delta = null;
        event_broker.emitNotify(this, delta);
    };

    List.prototype.introduce = function() {
        if (this.delta != null) {
            this.data = this._latest();
            this.delta = null;
        }
        event_broker.emitNotify(this, {
            root: this.data.slice(),
            added: [],
            removed: []
        });
    };

    // may be called during propagating or outside it

    List.prototype.leak = function(id) {
        id = arguments.length==0 ? this.nodeId : id;

        if (!event_broker.isOnProcessCall) {
            event_broker.invokeOnProcess(this, this.leak, [id]);
            return;
        }

        BaseList.prototype._leak.apply(this, [id]);

        if (this.usersCount===1) {
            DAG.addNode(this);
            event_broker.emitIntroduced(this);
        }
    };

    List.prototype.seal = function(id) {
        id = arguments.length==0 ? this.nodeId : id;
        BaseList.prototype.seal.apply(this, [id]);

        if (this.usersCount===0) {
            DAG.removeNode(this);
        }
    };

    // internal

    List.prototype._latest = function() {
        if (this.delta==null) return this.data;
        var data = this.delta.root == null ? this.data : this.delta.root;

        var result = [];
        for (var i=0;i<data.length;i++) {
            if (this.delta.removed.hasOwnProperty(data[i].key)) continue;
            result.push(data[i]);
        }
        for (var i=0;i<this.delta.added.length;i++) {
            if (this.delta.removed.hasOwnProperty(this.delta.added[i].key)) continue;
            result.push(this.delta.added[i]);
        }

        return result;
    };
}
