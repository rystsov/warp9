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

BaseList.prototype.sendAllMessages = function() {
    for (var i=0;i<this.dependants.length;i++) {
        this.sendItsMessages(this.dependants[i]);
    }
};

BaseList.prototype.sendItsMessages = function(dependant) {
    if (dependant.disabled) return;
    if (dependant.mailbox.length==0) return;
    var event = dependant.mailbox[dependant.mailbox.length - 1];
    dependant.mailbox = [];
    dependant.f(this, event);
};

BaseList.prototype.onEvent = function(f) {
    if (!event_broker.isOnProcessCall) {
        return event_broker.invokeOnProcess(this, this.onEvent, [f]);
    }

    this._leak(this.nodeId);

    var self = this;

    var dependant = {
        key: uid(),
        f: function(list, event) {
            if (this.disposed) return;
            f(event);
        },
        disposed: false,
        mailbox: [ ["reset", this.data.slice()] ]
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

BaseList.prototype._leak = function(id) {
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseList.prototype._seal = function(id) {
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

BaseList.prototype._putEventToDependants = function(event) {
    for (var i=0;i<this.dependants.length;i++) {
        this.dependants[i].mailbox.push(event);
    }
};


BaseList.prototype.reduceGroup = function(group, opt) {
    if (!opt) opt = {};
    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
    if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;

    return new AggregatedCell(this, GroupReducer, group, opt.wrap, opt.unwrap, opt.ignoreUnset);
};
