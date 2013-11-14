expose(DependentCell, function(){
    Matter = root.tng.Matter;
    Node = root.tng.dag.Node;
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    event_broker = root.tng.event_broker;
    tracker = root.tng.tracker;
    EmptyError = root.tng.reactive.EmptyError;
    DAG = root.tng.dag.DAG;
    BaseCell = root.tng.reactive.BaseCell;

    SetDependentCellPrototype();
});

var Matter, Node, None, Some, event_broker, tracker, EmptyError, DAG, BaseCell;

function DependentCell(f) {
    BaseCell.apply(this, []);
    this.attach(DependentCell);

    this.dependants = [];
    this.users = {};
    this.usersCount = 0;
    this.f = f;
}

function SetDependentCellPrototype() {
    DependentCell.prototype = new BaseCell();

    // dependenciesChanged, commit & introduced called during propagating only (!)

    DependentCell.prototype.dependenciesChanged = function() {
        var i;
        var known = {};
        for (i=0;i<this.dependencies.length;i++) {
            known[this.dependencies[i].nodeId] = this.dependencies[i];
        }

        var value, tracked, nova = {};
        tracker.inScope(function(){
            try {
                value = new Some(this.f());
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
            deleted[i].seal(this.nodeId);
        }
        for (i=0;i<added.length;i++) {
            added[i].leak(this.nodeId);
            DAG.addRelation(added[i], this);
        }

        this.dependencies = tracked;
        this.changed = {};

        if (this.content.isEmpty() && value.isEmpty()) {
            return false;
        }
        if (!this.content.isEmpty() && !value.isEmpty()) {
            if (this.content.value() === value.value()) {
                return false;
            }
        }
        this.delta = {value: value};
        return true;
    };

    DependentCell.prototype.commit = function() {
        this.content = this.delta.value;
        this.delta = null;
        event_broker.emitNotify(this);
    };

    DependentCell.prototype.introduce = function() {
        if (this.delta != null) {
            this.content = this.delta.value;
            this.delta = null;
        }
        event_broker.emitNotify(this);
    };


    /////
    DependentCell.prototype.leak = function() {
        id = arguments.length==0 ? this.nodeId : id;

        if (!event_broker.isOnProcessCall) {
            event_broker.invokeOnProcess(this, this.leak, [id]);
            return;
        }

        BaseCell.prototype._leak.apply(this, [id]);

        if (this.usersCount===1) {
            tracker.inScope(function(){
                try {
                    this.delta = {
                        value: new Some(this.f())
                    };
                } catch (e) {
                    if (e instanceof EmptyError) {
                        this.delta = {
                            value: new None()
                        };
                    } else {
                        throw e;
                    }
                }
                this.dependencies = tracker.tracked;
            }, this);
            DAG.addNode(this);
            for (var i=0;i<this.dependencies.length;i++) {
                this.dependencies[i].leak(this.nodeId);
                DAG.addRelation(this.dependencies[i], this);
            }
            event_broker.emitIntroduced(this);
        }
    };

    DependentCell.prototype.seal = function(event) {
        id = arguments.length==0 ? this.nodeId : id;
        BaseCell.prototype.seal.apply(this, [id]);

        if (this.usersCount===0) {
            for (var i=0;i<this.dependencies.length;i++) {
                DAG.removeRelation(this.dependencies[i], this);
                this.dependencies[i].seal(this.nodeId);
            }
            DAG.removeNode(this);
        }
    };

    ////


    DependentCell.prototype.hasValue = function() {
        var f = this.f;
        tracker.track(this);

        if (this.usersCount>0) {
            var value = this.content;
            if (this.delta != null) {
                value = this.delta.value;
            }
            return !value.isEmpty();
        } else {
            if (this.delta != null) throw new Error();
            return !tracker.outScope(function(){
                try {
                    return new Some(f());
                } catch (e) {
                    if (e instanceof EmptyError) {
                        return new None();
                    } else {
                        throw e;
                    }
                }
            }).isEmpty();
        }
    };

    DependentCell.prototype.unwrap = function(alt) {
        var f = this.f;
        tracker.track(this);

        var args = arguments.length==0 ? [] : [alt];

        var value = this.content;
        if (this.usersCount==0) {
            if (this.delta != null) throw new Error();
            value = tracker.outScope(function(){
                try {
                    var value = f();
                    return new Some(value);
                } catch (e) {
                    if (e instanceof EmptyError) {
                        return new None();
                    } else {
                        throw e;
                    }
                }
            });
        }
        if (this.delta != null) {
            value = this.delta.value;
        }

        return unwrap.apply(value, args);
    };

    function unwrap(alt) {
        if (arguments.length==0 && this.isEmpty()) {
            throw new Error();
        }
        return this.isEmpty() ? alt : this.value();
    }
}