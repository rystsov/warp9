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

    this.changeSet = [];
    this._setData(data || []);
}

function SetListPrototype() {
    List.prototype = new BaseList();

    // add, remove, setData are being called only outside of propagating

    List.prototype.add = function(f) {
        var key = uid();
        event_broker.postponeChange(this, ["add", key, f]);
        return key;
    };

    List.prototype.remove = function(key) {
        event_broker.postponeChange(this, ["remove", key]);
    };

    List.prototype.setData = function(data) {
        event_broker.postponeChange(this, ["setData", data]);
    };

    List.prototype.applyChange = function(change) {
        if (change[0]==="add") {
            return this._add(change[1],change[2]);
        } else if (change[0]==="remove") {
            return this._remove(change[1]);
        } else if (change[0]==="setData") {
            return this._setData(change[1]);
        } else {
            throw new Error();
        }
    };

    // dependenciesChanged is being called during propagating only (!)

    List.prototype.dependenciesChanged = function() {
        var info = {
            hasChanges: this.changeSet.length > 0,
            changeSet: this.changeSet
        };
        this.changeSet = []
        return info;
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
            this._putEventToDependants(["reset", this.data.slice()]);
            event_broker.notify(this);
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

    List.prototype._add = function(key, f) {
        if (typeof(f) != "function") {
            var item = f;
            f = function(id) { return item; };
        }

        var value = {key: key, value: f(key)};
        this.data.push(value);

        var event = ["add", value];
        this.changeSet.push(event);
        if (this.usersCount>0) {
            this._putEventToDependants(event);
            event_broker.notify(this);
        }

        return true;
    };

    List.prototype._remove = function(key) {
        this.data = this.data.filter(function(item) {
            return item.key != key;
        });

        var event = ["remove", key];
        this.changeSet.push(event);
        if (this.usersCount>0) {
            this._putEventToDependants(event);
            event_broker.notify(this);
        }

        return true;
    };

    List.prototype._setData = function(data) {
        this.data = data.map(function(item){
            return {
                key: uid(),
                value: item
            }
        });
        var event = ["reset", data.slice()];
        this.changeSet.push(event);
        if (this.usersCount>0) {
            this._putEventToDependants(event);
            event_broker.notify(this);
        }

        return true;
    };
}

List.handler = function(handlers) {
    return function(e) {
        while(true) {
            if (e[0]==="reset") break;
            if (e[0]==="add") break;
            if (e[0]==="remove") break;
            throw new Error();
        }
        handlers[e[0]].call(handlers, e[1]);
    };
};