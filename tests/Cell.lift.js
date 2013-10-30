var warp9 = require('../target/warp9.common');

var Cell = warp9.reactive.Cell;
var idgenerator = warp9.idgenerator;

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
    add2.leak(idgenerator());
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
    add2.leak(id);
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

exports.doubleLift = function(test) {
    test.expect(5);

    var cell = new Cell(2);
    var add2 = cell.lift(function(x){
        return x+2;
    });
    var add3 = add2.lift(function(x){
        return x+3;
    });
    test.equal(cell.dependants.length, 0);
    var id = idgenerator();
    add3.leak(id);
    test.equal(cell.dependants.length, 1);
    var event = null;
    add3.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event[0], 7);
    add3.leave(id);
    test.equal(cell.dependants.length, 0);
    event = null;
    cell.set(2);
    test.equal(event, null);

    test.done();
};