expose(BaseList, function() {
    List = root.reactive.List;
    GroupReducer = root.reactive.algebra.GroupReducer;
    MonoidReducer = root.reactive.algebra.MonoidReducer;
    ReducedList = root.reactive.lists.ReducedList;
    LiftedList = root.reactive.lists.LiftedList;
    Cell = root.reactive.Cell;
    checkBool = root.utils.checkBool;
});

var Cell, List, GroupReducer, MonoidReducer, LiftedList, ReducedList, checkBool;

function BaseList() {
    this.listId = root.idgenerator();
    this.type = List;
    this.dependantsId = 0;
    this.dependants = [];
    this.users = {};
    this.usersCount = 0;
    this.data = [];
}

BaseList.prototype.unwrap = function(f) {
    throw new Error("Not implemented");
};

BaseList.prototype.onEvent = function(f) {
    var event = {
        name: "onEvent",
        disposed: false,
        f: f,
        dispose: function() {}
    };

    root.reactive.event_broker.issue(this, event);

    return function() {
        event.disposed = true;
        event.dispose();
    };
};

BaseList.prototype.leak = function(id) {
    if (arguments.length==0) {
        return this.leak(this.listId);
    }
    root.reactive.event_broker.issue(this, {
        name: "leak",
        id: id
    });
    return this;
};

BaseList.prototype.leave = function(id) {
    if (arguments.length==0) {
        return this.leave(this.listId);
    }
    root.reactive.event_broker.issue(this, {
        name: "leave",
        id: id
    });
    return this;
};

BaseList.prototype.lift = function(f) {
    return new LiftedList(this, f);
};

BaseList.prototype.reduceGroup = function(group, opt) {
    if (!opt) opt = {};
    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
    if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;

    return new ReducedList(this, GroupReducer, group, opt.wrap, opt.unwrap, opt.ignoreUnset);
};

BaseList.prototype.reduceMonoid = function(monoid, opt) {
    if (!opt) opt = {};
    if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
    if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
    if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;

    return new ReducedList(this, MonoidReducer, monoid, opt.wrap, opt.unwrap, opt.ignoreUnset);
};

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
        if (typeof x === "object" && x.type === Cell) {
            return x.lift(function(x) { return checkBool(x) ? 1 : 0; });
        }
        return checkBool(x) ? 1 : 0;
    }).reduceGroup({
        identity: function() { return 0; },
        add: function(x,y) { return x+y; },
        invert: function(x) { return -x; }
    });
};

var knownEvents = {
    leave: "_leave",
    leak: "_leak",
    onEvent: "_onEvent"
};

BaseList.prototype.send = function(event) {
    if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
    if (!knownEvents.hasOwnProperty(event.name)) throw new Error("Unknown event: " + event.name);
    this[knownEvents[event.name]].apply(this, [event]);
};

BaseList.prototype._onEvent = function(event) {
    if (event.name!="onEvent") throw new Error();
    if (event.disposed) return;

    var id = this.dependantsId++;
    this.dependants.push({key: id, f: function(e) {
        if (event.disposed) return;
        event.f(e);
    }});

    event.dispose = function() {
        this.dependants = this.dependants.filter(function(d) {
            return d.key != id;
        });
    }.bind(this);

    if (this.usersCount>0) {
        var data = this.data.slice();

        root.reactive.lazy_run.run(function(){
            if (event.disposed) return;
            event.f(["data", data]);
        });
    }
};

BaseList.prototype._leak = function(event) {
    if (event.name!="leak") throw new Error();
    if (!event.hasOwnProperty("id")) throw new Error();
    var id = event.id;
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseList.prototype._leave = function(event) {
    if (event.name!="leave") throw new Error();
    if (!event.hasOwnProperty("id")) throw new Error();
    var id = event.id;
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


BaseList.prototype.__raise = function(e) {
    if (this.usersCount>0) {
        this.dependants.forEach(function(d){
            root.reactive.lazy_run.postpone(function(){
                d.f(e);
            });
        });
        root.reactive.lazy_run.run();
    }
};


