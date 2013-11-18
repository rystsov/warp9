expose(BaseList, function() {
    uid = root.uid;
    event_broker = root.core.event_broker;
    Matter = root.core.Matter;
    AggregatedCell = root.core.cells.AggregatedCell;
    GroupReducer = root.core.algebra.GroupReducer;
    MonoidReducer = root.core.algebra.MonoidReducer;
    LiftedList = root.core.lists.LiftedList;
    BaseCell = root.core.cells.BaseCell;
});

var uid, event_broker, Matter, AggregatedCell, GroupReducer, MonoidReducer, LiftedList, BaseCell;

function BaseList() {
    root.core.Matter.apply(this, []);
    root.core.dag.Node.apply(this, []);
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

BaseList.prototype.reduceMonoid = function(monoid, opt) {
    if (!opt) opt = {};
    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
    if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;

    return new AggregatedCell(this, MonoidReducer, monoid, opt.wrap, opt.unwrap, opt.ignoreUnset);
};

BaseList.prototype.lift = function(f) {
    return new LiftedList(this, f);
};

// extensions

BaseList.prototype.reduce = function(identity, add, opt) {
    return this.reduceMonoid({
        identity: function() {return identity; },
        add: add
    }, opt);
};

BaseList.prototype.all = function(predicate) {
    return this.lift(predicate).reduceGroup({
        identity: function() { return [0,0]; },
        add: function(x,y) { return [x[0]+y[0],x[1]+y[1]]; },
        invert: function(x) { return [-x[0],-x[1]]; }
    },{
        wrap: function(x) { return checkBool(x) ? [1,1] : [0,1]; },
        unwrap: function(x) { return x[0]==x[1]; }
    });
};

BaseList.prototype.count = function() {
    var predicate = arguments.length===0 ? function() { return true; } : arguments[0];

    return this.lift(function(x){
        x = predicate(x);
        if (x.metaType === Matter && x.instanceof(BaseCell)) {
            return x.lift(function(x) { return checkBool(x) ? 1 : 0; });
        }
        return checkBool(x) ? 1 : 0;
    }).reduceGroup({
        identity: function() { return 0; },
        add: function(x,y) { return x+y; },
        invert: function(x) { return -x; }
    });
};

function checkBool(x) {
    if (typeof x == "boolean") return x;
    throw new Error();
}