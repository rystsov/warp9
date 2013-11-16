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
        event_broker.postponeChange(this, {value: value});
    };

    Cell.prototype.unset = function() {
        event_broker.postponeChange(this, null);
    };

    Cell.prototype.applyChange = function(change) {
        if (change == null) {
            return this._update(new None(), ["unset"]);
        } else {
            return this._update(new Some(change.value), ["set", change.value]);
        }
    };

    // dependenciesChanged is being called during propagating only (!)

    Cell.prototype.dependenciesChanged = function() {
        return {
            hasChanges: true,
            changeSet: [this.content]
        };
    };

    // _leak & _seal are called only by onChange

    Cell.prototype._leak = function(id) {
        BaseCell.prototype._leak.apply(this, [id]);

        if (this.usersCount===1) {
            DAG.addNode(this);
        }
    };

    Cell.prototype._seal = function(id) {
        BaseCell.prototype._seal.apply(this, [id]);

        if (this.usersCount===0) {
            DAG.removeNode(this);
        }
    };

    // gets

    Cell.prototype.hasValue = function() {
        tracker.track(this);

        return !this.content.isEmpty();
    };

    Cell.prototype.unwrap = function(alt) {
        tracker.track(this);

        if (arguments.length==0 && this.content.isEmpty()) {
            throw new EmptyError();
        }
        return this.content.isEmpty() ? alt : this.content.value();
    };

    // utils

    Cell.prototype._update = function(value, event) {
        this.content = value;
        if (this.usersCount>0) {
            this._putEventToDependants(event);
            event_broker.notify(this);
        }
        return true;
    };
}
