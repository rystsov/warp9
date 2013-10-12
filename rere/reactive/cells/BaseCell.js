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
    var id = this.dependantsId++;
    this.dependants.push({key: id, f:f});
    return function() {
        this.dependants = this.dependants.filter(function(dependant) {
            return dependant.key!=id;
        });
    }.bind(this);
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

BaseCell.prototype.coalesce = function(replace) {
    return new CoalesceCell(this, replace);
};

BaseCell.prototype.when = function(condition, transform) {
    var test = typeof condition === "function" ? condition : function(value) {
        return value === condition;
    };

    var map = typeof transform === "function" ? transform : function() { return transform; };

    return new WhenCell(test, map);
};

BaseCell.prototype.bind = function(f) {
    return new BindedCell(this, f);
};

BaseCell.prototype.raise = function(e) {
    this.dependants.forEach(function(d){ d.f(e); });
};