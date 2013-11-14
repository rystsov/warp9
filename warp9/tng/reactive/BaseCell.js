expose(BaseCell, function(){
    Matter = root.tng.Matter;
    Node = root.tng.dag.Node;
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    event_broker = root.tng.event_broker;
    tracker = root.tng.tracker;
    EmptyError = root.tng.reactive.EmptyError;
    DAG = root.tng.dag.DAG;
    uid = root.idgenerator;
});

var Matter, Node, None, Some, event_broker, EmptyError, DAG, tracker, uid;

function BaseCell() {
    root.tng.Matter.apply(this, []);
    root.tng.dag.Node.apply(this, []);
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
        dependant.disposed = true;
        self.dependants = self.dependants.filter(function(d) {
            return d.key != id;
        });
    };
};

BaseCell.prototype._leak = function(id) {
    id = arguments.length==0 ? this.nodeId : id;

    if (this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseCell.prototype._seal = function(id) {
    id = arguments.length==0 ? this.nodeId : id;

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