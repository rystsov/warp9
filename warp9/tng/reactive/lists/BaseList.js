expose(BaseList, function() {
    uid = root.idgenerator;
    event_broker = root.tng.event_broker;
    Matter = root.tng.Matter;
    AggregatedCell = root.tng.reactive.AggregatedCell;
    GroupReducer = root.tng.reactive.algebra.GroupReducer;

});

var uid, event_broker, Matter, AggregatedCell, GroupReducer;

function BaseList() {
    Matter.apply(this, []);
    this.attach(BaseList);

    this.listId = uid();
    this.dependants = [];
    this.data = [];
    this.users = {};
    this.usersCount = 0;
}

// TODO: separate user's onEvent and systems's onEvent
// TODO: postpone user's via event_broker

BaseList.prototype.unwrap = function(alt) {
    throw new Error("Not implemented");
};

BaseList.prototype.reduceGroup = function(group, opt) {
    if (!opt) opt = {};
    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
    if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;

    return new AggregatedCell(this, GroupReducer, group, opt.wrap, opt.unwrap, opt.ignoreUnset);
};

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

    dependant.f(this, ["data", this.data.slice()]);

    return function() {
        dependant.disposed = true;
        this.dependants = this.dependants.filter(function(d) {
            return d.key != id;
        });
    }.bind(this);
};

BaseList.prototype.leak = function(id) {
    if (arguments.length==0) {
        return this.leak(this.listId);
    }
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
    return this;
};

BaseList.prototype.seal = function(id) {
    if (arguments.length==0) {
        return this.seal(this.listId);
    }
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
    return this;
};

BaseList.prototype.__raise = function(e) {
    if (!event_broker.isOnProcessCall) {
        return event_broker.invokeOnProcess(this, this.__raise, [e]);
    }

    if (this.usersCount>0) {
        for (var i=0;i<this.dependants.length;i++) {
            this.dependants[i].f(this, e);
        }
    }
};
