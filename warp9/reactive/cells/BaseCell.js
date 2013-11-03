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

BaseCell.prototype.unwrap = function() {
    throw new Error("Not implemented");
};

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

BaseCell.prototype.leak = function(id) {
    if (arguments.length==0) {
        return this.leak(this.cellId);
    }
    root.reactive.event_broker.issue(this, {
        name: "leak",
        id: id
    });
    return this;
};

BaseCell.prototype.seal = function(id) {
    if (arguments.length==0) {
        return this.seal(this.cellId);
    }
    root.reactive.event_broker.issue(this, {
        name: "seal",
        id: id
    });
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

    var map = null;
    if (arguments.length > 1) {
        map = typeof transform === "function" ? transform : function() { return transform; };
    }

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

BaseCell.prototype.coalesce = function(replace) {
    return new CoalesceCell(this, replace);
};

BaseCell.prototype.onSet = function(f) {
    return this.onEvent(Cell.handler({
        set: f,
        unset:  function() {}
    }));
};

BaseCell.prototype.isSet = function() {
    return this.lift(function(){ return true }).coalesce(false);
};

BaseCell.prototype.fireOnceOn = function(value, action) {
    var self = this;
    return self.leak().onEvent(Cell.handler({
        set: function(x) {
            if (x===value) {
                self.seal();
                action();
            }
        },
        unset: function() {}
    }))
};

var knownEvents = {
    seal: "_seal",
    leak: "_leak",
    onEvent: "_onEvent"
};

BaseCell.prototype.send = function(event) {
    if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
    if (!knownEvents.hasOwnProperty(event.name)) throw new Error("Unknown event: " + event.name);
    this[knownEvents[event.name]].apply(this, [event]);
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

        root.reactive.event_broker.call(function(){
            if (event.disposed) return;
            if (content.isEmpty()) {
                event.f(["unset"]);
            } else {
                event.f(["set", content.value()]);
            }
        });
    }
};

BaseCell.prototype._leak = function(event) {
    if (event.name!="leak") throw new Error();
    if (!event.hasOwnProperty("id")) throw new Error();
    var id = event.id;
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseCell.prototype._seal = function(event) {
    if (event.name!="seal") throw new Error();
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

    root.reactive.event_broker.call(this.dependants.map(function(d){
        return function(){
            d.f(e);
        }
    }));
};

