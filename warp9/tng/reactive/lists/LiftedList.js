expose(LiftedList, function(){
    BaseList = root.tng.reactive.lists.BaseList;

    SetLiftedPrototype();
});

var BaseList;

function LiftedList(source, f) {
    BaseList.apply(this);
    this.attach(LiftedList);

    this.source = source;
    this.f = f;
}

function SetLiftedPrototype() {
    LiftedList.prototype = new BaseList();

    LiftedList.prototype.dependenciesChanged = function() {
        if (this.source.delta==null) throw new Error();
        this.delta = liftDelta(this.source.delta, this.f);
        return true;
    };

    LiftedList.prototype.unwrap = function() {
        if (this.usersCount > 0) {
            return this._latest();
        } else {
            return this.source.unwrap().map(function(item){
                return this.f(item);
            }.bind(this));
        }
    };

    LiftedList.prototype.leak = function() {
        var id = arguments.length==0 ? this.nodeId : arguments[0];

        if (!event_broker.isOnProcessCall) {
            event_broker.invokeOnProcess(this, this.leak, [id]);
            return;
        }

        BaseList.prototype._leak.apply(this, [id]);

        if (this.usersCount===1) {
            if (this.delta != null) throw new Error();

            this.source.leak(this.nodeId);
            this.data = liftData(this.source.data, this.f);
            this.delta = liftDelta(this.source.delta, this.f);

            DAG.addNode(this);
            DAG.addRelation(this.source, this);
            event_broker.emitIntroduced(this);
        }
    };

    LiftedList.prototype.seal = function() {
        var id = arguments.length==0 ? this.nodeId : arguments[0];

        BaseList.prototype._seal.apply(this, [id]);

        if (this.usersCount===0) {
            DAG.removeRelation(this.source, this);
            this.source.seal(this.nodeId);
            DAG.removeNode(this);
        }
    };

    function liftDelta(delta, f) {
        if (delta==null) return null;

        var result = {
            root: null,
            added: [],
            removed: []
        };

        if (delta.root != null) {
            result.root = liftData(delta.root, f);
        }

        for (var i=0;i<delta.added.length;i++) {
            result.added.push({
                key: delta.added[i].key,
                value: f(delta.added[i].value)
            })
        }

        result.removed = delta.removed.slice();
        return result;
    }

    function liftData(data, f) {
        var result = [];
        for (var i=0;i<data.length;i++) {
            result.push({
                key: data[i].key,
                value: f(data[i].value)
            })
        }
        return result;
    }
}