expose(DependentCell, function(){
    Matter = root.tng.Matter;
    Node = root.core.dag.Node;
    None = root.core.adt.maybe.None;
    Some = root.core.adt.maybe.Some;
    event_broker = root.core.event_broker;
    tracker = root.core.tracker;
    EmptyError = root.core.cells.EmptyError;
    DAG = root.core.dag.DAG;
    BaseCell = root.core.cells.BaseCell;

    SetDependentCellPrototype();
});

var Matter, Node, None, Some, event_broker, tracker, EmptyError, DAG, BaseCell;

function DependentCell(f, context) {
    BaseCell.apply(this, []);
    this.attach(DependentCell);

    this.dependants = [];
    this.users = {};
    this.usersCount = 0;
    this.f = f;
    this.context = context;
    this.dependencies = null;
    this.content = null;
}

function SetDependentCellPrototype() {
    DependentCell.prototype = new BaseCell();

    // dependenciesChanged is being called during propagating only (!)

    DependentCell.prototype.dependenciesChanged = function() {
        var i;
        var known = {};
        for (i=0;i<this.dependencies.length;i++) {
            known[this.dependencies[i].nodeId] = this.dependencies[i];
        }

        var value, tracked, nova = {};
        tracker.inScope(function(){
            try {
                value = new Some(this.f.apply(this.context, []));
            } catch (e) {
                if (e instanceof EmptyError) {
                    value = new None();
                } else {
                    throw e;
                }
            }
            tracked = tracker.tracked;
        }, this);

        var deleted = [];
        var added = [];
        for (i=0;i<tracked.length;i++) {
            nova[tracked[i].nodeId] = tracked[i];
            if (!known.hasOwnProperty(tracked[i].nodeId)) {
                added.push(tracked[i]);
            }
        }
        for (i=0;i<this.dependencies.length;i++) {
            if (!nova.hasOwnProperty(this.dependencies[i].nodeId)) {
                deleted.push(this.dependencies[i]);
            }
        }

        for (i=0;i<deleted.length;i++) {
            DAG.removeRelation(deleted[i], this);
            deleted[i]._seal(this.nodeId);
        }
        for (i=0;i<added.length;i++) {
            added[i]._leak(this.nodeId);
            DAG.addRelation(added[i], this);
        }

        this.dependencies = tracked;
        this.changed = {};

        if (this.content.isEmpty() && value.isEmpty()) {
            return { hasChanges: false };
        }
        if (!this.content.isEmpty() && !value.isEmpty()) {
            if (this.content.value() === value.value()) {
                return { hasChanges: false };
            }
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

    DependentCell.prototype._leak = function(id) {
        BaseCell.prototype._leak.apply(this, [id]);

        if (this.usersCount===1) {
            tracker.inScope(function(){
                try {
                    this.content = new Some(this.f.apply(this.context, []));
                } catch (e) {
                    if (e instanceof EmptyError) {
                        this.content = new None();
                    } else {
                        throw e;
                    }
                }
                this.dependencies = tracker.tracked;
            }, this);

            DAG.addNode(this);
            for (var i=0;i<this.dependencies.length;i++) {
                this.dependencies[i]._leak(this.nodeId);
                DAG.addRelation(this.dependencies[i], this);
            }
        }
    };

    DependentCell.prototype._seal = function(id) {
        BaseCell.prototype._seal.apply(this, [id]);

        if (this.usersCount===0) {
            for (var i=0;i<this.dependencies.length;i++) {
                DAG.removeRelation(this.dependencies[i], this);
                this.dependencies[i]._seal(this.nodeId);
            }
            DAG.removeNode(this);
            this.dependencies = null;
            this.content = null;
        }
    };

    // gets

    DependentCell.prototype.hasValue = function() {
        var marker = {};
        return this.unwrap(marker) !== marker;
    };

    DependentCell.prototype.unwrap = function(alt) {
        tracker.track(this);

        var args = arguments.length==0 ? [] : [alt];

        var value = this.content;
        if (this.usersCount===0) {
            value = tracker.outScope(function(){
                try {
                    return new Some(this.f.apply(this.context, []));
                } catch (e) {
                    if (e instanceof EmptyError) {
                        return new None();
                    } else {
                        throw e;
                    }
                }
            }, this);
        }

        return unwrap.apply(value, args);
    };

    function unwrap(alt) {
        if (arguments.length==0 && this.isEmpty()) {
            throw new EmptyError();
        }
        return this.isEmpty() ? alt : this.value();
    }
}