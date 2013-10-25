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

BaseCell.prototype.fix = function() {
    this.use(this.cellId);
    return this;
};

BaseCell.prototype.unfix = function() {
    this.leave(this.cellId);
    return this;
};

BaseCell.prototype.onEvent = function(f) {
    var disposed = false;
    root.reactive.lazy_run.run(function(){
        if (disposed) return;
        if (this.usersCount>0 && this.content!=null) {
            if (this.content.isEmpty()) {
                f(["unset"]);
            } else {
                f(["set", this.content.value()]);
            }
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

BaseCell.prototype.onSet = function(f) {
    return this.onEvent(Cell.handler({
        set: f,
        unset:  function() {}
    }));
};

BaseCell.prototype.use = function(id) {
    if (!this.users.hasOwnProperty(id)) {
        this.users[id] = 0;
    }
    this.users[id]++;
    this.usersCount++;
};

BaseCell.prototype.leave = function(id) {
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

BaseCell.prototype.unwrap = function() {
    throw new Error("Not implemented");
};

BaseCell.prototype.lift = function(f) {
    return new LiftedCell(this, f);
};

BaseCell.prototype.isSet = function() {
    return this.lift(function(){ return true }).coalesce(false);
};

BaseCell.prototype.coalesce = function(replace) {
    return new CoalesceCell(this, replace);
};

BaseCell.prototype.when = function(condition, transform) {
    var test = typeof condition === "function" ? condition : function(value) {
        return value === condition;
    };

    var map = typeof transform === "function" ? transform : function() { return transform; };

    var opt = {
        condition: test,
        transform: map
    };

    if (arguments.length==3) {
        opt.alternative = arguments[2];
    }

    return new WhenCell(this, opt);
};

BaseCell.prototype.bind = function(f) {
    return new BindedCell(this, f);
};

BaseCell.prototype.raise = function(e) {
    if (arguments.length===0) {
        if (this.content.isEmpty()) {
            this.raise(["unset"]);
        } else {
            this.raise(["set", this.content.value()]);
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