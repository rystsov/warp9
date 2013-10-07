expose(BaseCell, function() {
    LiftedCell = root.reactive.cells.LiftedCell;
    idgenerator = root.idgenerator;
});

var LiftedCell, idgenerator;

function BaseCell() {
    this.cellId = idgenerator();
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