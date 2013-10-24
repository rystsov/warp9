expose(Cell, function(){
    None = root.adt.maybe.None;
    Some = root.adt.maybe.Some;
    BaseCell = root.reactive.cells.BaseCell;

    SetCellPrototype();
});


// pull by default (unwrap)
// subscribe (onEvent) doesn't activate (switch to push) cell

var Some, None, BaseCell;

function Cell() {
    BaseCell.apply(this, []);

    this.content = new None();
    if (arguments.length>0) {
        this.set(arguments[0])
    }
}

function SetCellPrototype() {
    Cell.prototype = new BaseCell();

    Cell.prototype.unwrap = function(alt) {
        if (arguments.length==0 && this.content.isEmpty()) throw new Error();
        return this.content.isEmpty() ? alt : this.content.value();
    };

    // Specific
    Cell.prototype.set = function(value) {
        this.content = new Some(value);
        this.raise(["set", value]);
    };

    Cell.prototype.unset = function() {
        this.content = new None();
        this.raise(["unset"])
    };
}

Cell.handler = function(handler) {
    return function(e) {
        if (e[0]==="set") {
            handler.set(e[1]);
        } else if (e[0]==="unset") {
            handler.unset();
        } else {
            throw new Error("Unknown event: " + e[0]);
        }
    };
};
