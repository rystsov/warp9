var rere = require('../rere.common');

var Cell = rere.reactive.Cell;
var idgenerator = rere.idgenerator;

exports.subscribeUnused = function(test) {
    test.expect(4);

    var cell = new Cell();
    var add2 = cell.lift(function(x){
        return x+2;
    });
    var event = null;
    add2.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event, null);
    cell.set(1);
    test.equal(event, null);
    test.equal(add2.unwrap(), 3);
    test.equal(event, null);

    test.done();
};

exports.subscribeUsed = function(test) {
    test.expect(2);

    var cell = new Cell();
    var add2 = cell.lift(function(x){
        return x+2;
    });
    add2.use(idgenerator());
    var event = null;
    add2.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event.length, 0);
    cell.set(1);
    test.equal(event[0], 3);

    test.done();
};

exports.subscribeUseLeave = function(test) {
    test.expect(6);

    var cell = new Cell();
    var add2 = cell.lift(function(x){
        return x+2;
    });
    test.equal(cell.dependants.length, 0);
    var id = idgenerator();
    add2.use(id);
    test.equal(cell.dependants.length, 1);
    var event = null;
    add2.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event.length, 0);
    cell.set(1);
    test.equal(event[0], 3);
    add2.leave(id);
    test.equal(cell.dependants.length, 0);
    event = null;
    cell.set(2);
    test.equal(event, null);

    test.done();
};
