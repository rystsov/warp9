var warp9 = require('../target/warp9.common');

var Cell = warp9.reactive.Cell;
var idgenerator = warp9.idgenerator;

exports.subscribeUnused = function(test) {
    test.expect(4);

    var cell = new Cell();
    var or2 = cell.coalesce(2);
    var event = null;
    or2.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event, null);
    test.equal(or2.unwrap(), 2);
    cell.set(1);
    test.equal(or2.unwrap(), 1);
    test.equal(event, null);

    test.done();
};

exports.subscribeUsed = function(test) {
    test.expect(2);

    var cell = new Cell();
    var or2 = cell.coalesce(2);
    or2.leak(idgenerator());
    var event = null;
    or2.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event[0], 2);
    cell.set(1);
    test.equal(event[0], 1);

    test.done();
};

exports.subscribeUseLeave = function(test) {
    test.expect(6);

    var cell = new Cell();
    var or2 = cell.coalesce(2);
    test.equal(cell.dependants.length, 0);
    var id = idgenerator();
    or2.leak(id);
    test.equal(cell.dependants.length, 1);
    var event = null;
    or2.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event[0], 2);
    cell.set(1);
    test.equal(event[0], 1);
    or2.seal(id);
    test.equal(cell.dependants.length, 0);
    event = null;
    cell.set(2);
    test.equal(event, null);

    test.done();
};

exports.coalesceLift = function(test) {
    test.expect(5);

    var cell = new Cell();
    var or2 = cell.coalesce(2);
    var add3 = or2.lift(function(x){
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
    test.equal(event[0], 5);
    add3.seal(id);
    test.equal(cell.dependants.length, 0);
    event = null;
    cell.set(2);
    test.equal(event, null);

    test.done();
};