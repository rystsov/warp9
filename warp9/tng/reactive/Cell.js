expose(Cell, function(){
    BaseCell = root.tng.reactive.BaseCell;
    Matter = root.tng.Matter;
    Node = root.tng.dag.Node;
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    event_broker = root.tng.event_broker;
    tracker = root.tng.tracker;
    EmptyError = root.tng.reactive.EmptyError;
    DAG = root.tng.dag.DAG;

    SetCellPrototype();
});

var BaseCell, Matter, Node, None, Some, event_broker, EmptyError, DAG, tracker;

function Cell() {
    BaseCell.apply(this, []);
    this.attach(Cell);

    if (arguments.length===0) {
        this.content = new None();
    } else {
        this.content = new Some(arguments[0]);
    }
}

function SetCellPrototype() {
    Cell.prototype = new BaseCell();

    // set and unset called only outside of propagating

    Cell.prototype.set = function(value) {
        this._update(new Some(value));
    };

    Cell.prototype.unset = function() {
        this._update(new None());
    };

    Cell.prototype._update = function(value) {
        if (this.usersCount>0) {
            this.delta = {
                value: value
            };
            event_broker.emitChanged(this);
        } else {
            if (this.delta != null) {
                throw new Error();
            }
            this.content = value;
        }
    };

    // dependenciesChanged, commit & introduced called during propagating only (!)

    Cell.prototype.dependenciesChanged = function() {
        return this.delta != null;
    };

    Cell.prototype.commit = function() {
        this.content = this.delta.value;
        this.delta = null;
        event_broker.emitNotify(this);
    };

    Cell.prototype.introduce = function() {
        if (this.delta != null) {
            this.content = this.delta.value;
            this.delta = null;
        }
        event_broker.emitNotify(this);
    };

    // may be called during propagating or outside it

    Cell.prototype.leak = function(id) {
        id = arguments.length==0 ? this.nodeId : id;

        if (!event_broker.isOnProcessCall) {
            event_broker.invokeOnProcess(this, this.leak, [id]);
            return;
        }

        BaseCell.prototype._leak.apply(this, [id]);

        if (this.usersCount===1) {
            DAG.addNode(this);
            event_broker.emitIntroduced(this);
        }
    };

    Cell.prototype.seal = function(id) {
        id = arguments.length==0 ? this.nodeId : id;
        BaseCell.prototype.seal.apply(this, [id]);

        if (this.usersCount===0) {
            DAG.removeNode(this);
        }
    };

    Cell.prototype.hasValue = function() {
        tracker.track(this);

        var value = this.content;
        if (this.delta != null) {
            value = this.delta.value;
        }

        return !value.isEmpty();
    };

    Cell.prototype.unwrap = function(alt) {
        tracker.track(this);

        var value = this.content;
        if (this.delta != null) {
            value = this.delta.value;
        }

        if (arguments.length==0 && value.isEmpty()) {
            throw new EmptyError();
        }
        return value.isEmpty() ? alt : value.value();
    };
}
