expose(BaseList, function() {
    uid = root.idgenerator;
    event_broker = root.tng.event_broker;
    Matter = root.tng.Matter;
    AggregatedCell = root.tng.reactive.AggregatedCell;
    GroupReducer = root.tng.reactive.algebra.GroupReducer;

});

var uid, event_broker, Matter, AggregatedCell, GroupReducer;

function BaseList() {
    root.tng.Matter.apply(this, []);
    root.tng.dag.Node.apply(this, []);
    this.attach(BaseList);

    this.dependants = [];
    this.data = [];
    this.users = {};
    this.usersCount = 0;
}



BaseList.prototype.onEvent = function(f) {
    if (!event_broker.isOnProcessCall) {
        return event_broker.invokeOnProcess(this, this.onEvent, [f]);
    }

    var dependant = {
        key: uid(),
        f: function(list, event) {
            if (this.disposed || list.usersCount==0) return;
            f(event);
        },
        disposed: false
    };

    this.dependants.push(dependant);

    event_broker.emitNotifySingle(this, dependant.f, {
        root: this.data.slice(),
        added: [],
        removed: []
    });

    return function() {
        dependant.disposed = true;
        this.dependants = this.dependants.filter(function(d) {
            return d.key != id;
        });
    }.bind(this);
};

BaseList.prototype._leak = function(id) {
    id = arguments.length==0 ? this.nodeId : id;

    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseList.prototype._seal = function(id) {
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




BaseList.prototype.reduceGroup = function(group, opt) {
    if (!opt) opt = {};
    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
    if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;

    return new AggregatedCell(this, GroupReducer, group, opt.wrap, opt.unwrap, opt.ignoreUnset);
};
