expose(BaseCell, function(){
    Matter = root.tng.Matter;
    Node = root.tng.dag.Node;
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    event_broker = root.tng.event_broker;
    tracker = root.tng.tracker;
    EmptyError = root.tng.reactive.EmptyError;
    DAG = root.tng.dag.DAG;
});

var Matter, Node, None, Some, event_broker, EmptyError, DAG, tracker;

function BaseCell() {
    root.tng.Matter.apply(this, []);
    root.tng.dag.Node.apply(this, []);
    this.attach(BaseCell);

    this.dependants = [];
    this.users = {};
    this.usersCount = 0;
}

BaseCell.prototype.onChange = function(f) {
    if (!event_broker.isOnProcessCall) {
        return event_broker.invokeOnProcess(this, this.onChange, [f]);
    }

    var self = this;
    var active = true;
    
    var dependant = {
        key: root.idgenerator(),
        f: function(obj) {
            if (active && obj.usersCount>0) {
                f(obj);
            }
        }
    };

    this.dependants.push(dependant);
    
    event_broker.emitNotifySingle(this, dependant.f);

    return function() {
        active = false;
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

BaseCell.prototype.seal = function(id) {
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