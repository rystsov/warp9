expose(BaseCell, function() {
    LiftedCell = root.reactive.cells.LiftedCell;
    CoalesceCell = root.reactive.cells.CoalesceCell;
    WhenCell = root.reactive.cells.WhenCell;
    BindedCell = root.reactive.cells.BindedCell;
    Cell = root.reactive.Cell;
});

var LiftedCell, CoalesceCell, WhenCell, BindedCell, Cell;

function BaseCell() {
    this.cellId = root.idgenerator();
    this.type = Cell;
    this.dependantsId = 0;
    this.dependants = [];
    this.content = null;
    this.unsubscribe = null;
    this.users = {};
    this.usersCount = 0;
}

BaseCell.prototype.onEvent = function(f) {
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

BaseCell.prototype.use = function(id) {
    root.reactive.event_broker.issue(this, {
        name: "use",
        id: id
    });
};

BaseCell.prototype.leave = function(id) {
    root.reactive.event_broker.issue(this, {
        name: "leave",
        id: id
    });
};

BaseCell.prototype.unwrap = function() {
    throw new Error("Not implemented");
};

BaseCell.prototype.fix = function() {
    this.use(this.cellId);
    return this;
};

BaseCell.prototype.unfix = function() {
    this.leave(this.cellId);
    return this;
};

BaseCell.prototype.lift = function(f) {
    return new LiftedCell(this, f);
};

BaseCell.prototype.bind = function(f) {
    return new BindedCell(this, f);
};

BaseCell.prototype.when = function(condition, transform, alternative) {
    var test = typeof condition === "function" ? condition : function(value) {
        return value === condition;
    };

    var map = typeof transform === "function" ? transform : function() { return transform; };

    var alt = null;
    if (arguments.length==3) {
        alt = typeof alternative === "function" ? alternative : function() { return alternative; };
    }

    var opt = {
        condition: test,
        transform: map,
        alternative: alt
    };

    return new WhenCell(this, opt);
};

var knownEvents = {
    leave: "_leave",
    use: "_use",
    onEvent: "_onEvent"
};

BaseCell.prototype.send = function(event) {
    if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
    if (!knownEvents.hasOwnProperty(event.name)) throw new Error("Unknown event: " + event.name);
    this[knownEvents[event.name]].apply(this, [event]);
};

BaseCell.prototype._use = function(event) {
    if (event.name!="use") throw new Error();
    if (!event.hasOwnProperty("id")) throw new Error();
    var id = event.id;
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseCell.prototype._leave = function(event) {
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

BaseCell.prototype._onEvent = function(event) {
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

    if (this.usersCount>0 && this.content!=null) {
        var content = this.content;

        root.reactive.lazy_run.run(function(){
            if (content.isEmpty()) {
                event.f(["unset"]);
            } else {
                event.f(["set", content.value()]);
            }
        });
    }
};

BaseCell.prototype.__raise = function(e) {
    if (arguments.length===0) {
        if (this.content.isEmpty()) {
            this.__raise(["unset"]);
        } else {
            this.__raise(["set", this.content.value()]);
        }
        return;
    }
    if (this.usersCount==0) return;
    this.dependants.forEach(function(d){
        root.reactive.lazy_run.postpone(function(){
            d.f(e);
        });
    });
    root.reactive.lazy_run.run();
};

//BaseCell.prototype.onSet = function(f) {
//    return this.onEvent(Cell.handler({
//        set: f,
//        unset:  function() {}
//    }));
//};

//BaseCell.prototype.isSet = function() {
//    return this.lift(function(){ return true }).coalesce(false);
//};

//BaseCell.prototype.coalesce = function(replace) {
//    return new CoalesceCell(this, replace);
//};