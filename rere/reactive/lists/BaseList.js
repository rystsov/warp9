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

BaseList.prototype.onEvent = function(f) {
    var disposed = false;
    root.reactive.lazy_run.run(function(){
        if (disposed) return;
        if (this.usersCount>0) {
            f(["data", this.data.slice()])
        }
    }.bind(this));

    var id = this.dependantsId++;
    this.dependants.push({key: id, f:f});

    return function() {
        disposed = true;
        this.dependants = this.dependants.filter(function(dependant) {
            return dependant.key!=id;
        });
    }.bind(this);
};

BaseList.prototype.raise = function(e) {
    this.dependants.forEach(function(d){
        root.reactive.lazy_run.postpone(function(){
            d.f(e);
        });
    });
    root.reactive.lazy_run.run();
};

BaseList.prototype.use = function(id) {
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseList.prototype.leave = function(id) {
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

BaseList.prototype.fix = function() {
    this.use(this.listId);
    return this;
};

BaseList.prototype.unfix = function() {
    this.leave(this.listId);
    return this;
};


BaseList.prototype.unwrap = function(f) {
    throw new Error("Not implemented");
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


function initReducer(list, reducer) {
    var subscribes = {};
    list.onEvent(List.handler({
        data: function(e) {
            for (var i=0;i < e.length;i++) {
                subscribes[e[i].key] = reducer.add(e[i].value);
            }
        },
        add: function(e) {
            subscribes[e.key] = reducer.add(e.value);
        },
        remove: function(e) {
            if (e in subscribes) {
                subscribes[e]();
                delete subscribes[e];
            }
        }
    }));
}


