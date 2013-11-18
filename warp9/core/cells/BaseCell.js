expose(BaseCell, function(){
    Matter = root.core.Matter;
    Node = root.core.dag.Node;
    None = root.core.adt.maybe.None;
    Some = root.core.adt.maybe.Some;
    event_broker = root.core.event_broker;
    tracker = root.core.tracker;
    EmptyError = root.core.cells.EmptyError;
    DAG = root.core.dag.DAG;
    uid = root.uid;
    empty = root.empty;
});

var Matter, Node, None, Some, event_broker, EmptyError, DAG, tracker, uid, empty;

function BaseCell() {
    root.core.Matter.apply(this, []);
    root.core.dag.Node.apply(this, []);
    this.attach(BaseCell);

    this.dependants = [];
    this.users = {};
    this.usersCount = 0;
}

BaseCell.prototype.sendAllMessages = function() {
    for (var i=0;i<this.dependants.length;i++) {
        this.sendItsMessages(this.dependants[i]);
    }
};

BaseCell.prototype.sendItsMessages = function(dependant) {
    if (dependant.disabled) return;
    if (dependant.mailbox.length==0) return;
    var event = dependant.mailbox[dependant.mailbox.length - 1];
    dependant.mailbox = [];
    dependant.f(this, event);
};

BaseCell.prototype.onChange = function(f) {
    if (!event_broker.isOnProcessCall) {
        return event_broker.invokeOnProcess(this, this.onChange, [f]);
    }

    this._leak(this.nodeId);

    var self = this;

    var dependant = {
        key: uid(),
        f: function(obj) {
            if (this.disposed) return;
            f(obj);
        },
        disposed: false,
        mailbox: [ this.content.isEmpty() ? ["unset"] : ["set", this.content.value()]]
    };

    this.dependants.push(dependant);

    if (this.usersCount > 0) {
        event_broker.notifySingle(this, dependant);
    }

    return function() {
        if (dependant.disposed) return;
        self._seal(self.nodeId);
        dependant.disposed = true;
        self.dependants = self.dependants.filter(function(d) {
            return d.key != dependant.key;
        });
    };
};

BaseCell.prototype._leak = function(id) {
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseCell.prototype._seal = function(id) {
    if (!this.users.hasOwnProperty(id)) {
        throw new Error();
    }
    if (this.users[id]===0) {
        throw new Error();
    }
    this.users[id]--;
    this.usersCount--;
    if (this.users[id]===0) {
        delete this.users[id];
    }
};

BaseCell.prototype._putEventToDependants = function(event) {
    for (var i=0;i<this.dependants.length;i++) {
        this.dependants[i].mailbox.push(event);
    }
};

// extensions

BaseCell.prototype.coalesce = function(value) {
    return root.do(function(){
        return this.get(value);
    }, this);
};

BaseCell.prototype.lift = function(f) {
    return root.do(function(){
        return f(this.get());
    }, this);
};

BaseCell.prototype.when = function(condition, transform, alternative) {
    var test = typeof condition === "function" ? condition : function(value) {
        return value === condition;
    };

    var map = null;
    if (arguments.length > 1) {
        map = typeof transform === "function" ? transform : function() { return transform; };
    }

    var alt = null;
    if (arguments.length==3) {
        alt = typeof alternative === "function" ? alternative : function() { return alternative; };
    }

    return root.do(function(){
        var value = this.get();
        if (test(value)) {
            return map != null ? map(value) : value;
        } else {
            return alt != null ? alt(value) : empty();
        }
    }, this);
};