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

    Cell.prototype.dependenciesChanged = function() {
        return this.delta != null;
    };

    Cell.prototype.set = function(value) {
        this.delta = {
            value: new Some(value)
        };
        if (this.usersCount>0) {
            event_broker.emitChanged(this);
        }
    };

    Cell.prototype.unset = function() {
        this.delta = {
            value: new None()
        };
        if (this.usersCount>0) {
            event_broker.emitChanged(this);
        }
    };

    Cell.prototype.commit = function() {
        this.content = this.delta.value;
        this.delta = null;
    };

    Cell.prototype.leak = function(id) {
        id = arguments.length==0 ? this.nodeId : id;

        if (!event_broker.isOnProcessCall) {
            event_broker.invokeOnProcess(this, this.leak, [id]);
            return;
        }

        BaseCell.prototype._leak.apply(this, [id]);

        if (this.usersCount===1) {
            if (this.delta!=null) {
                this.commit();
            }
            DAG.addNode(this);
            event_broker.emitNotify(this);
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



// onChange, leak, seal may be called by user outside the event processing
// onChange, leak, seal can't be called during propagating
// onChange may emit NOTIFY-SINGLE (node, f)
// leak, seal may change graph structure
// graph structure changes emit NOTIFY (node)
// NOTIFY aren't processed during onChange, leak, seal
// All should SET, UNSET be are processed prior start processing NOTIFY
// if more then one NOTIFY* for the same node
