var rere = require('../rere.common');

var Cell = rere.reactive.Cell;

exports.ctor = function(test) {
    test.expect(0);
    var cell = new Cell();
    test.done();
};

exports.unwrapValue = function(test) {
    test.expect(1);
    var value = {};
    var cell = new Cell(value);
    test.equal(cell.unwrap(), value);
    test.done();
};

exports.unwrapEmpty = function(test) {
    test.expect(1);
    var marker = {};
    var cell = new Cell();
    test.equal(cell.unwrap(marker), marker);
    test.done();
};

exports.subscribeEmptyChange = function(test) {
    test.expect(2);
    var event = null;
    var cell = new Cell();
    cell.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event, null);
    var marker = {};
    cell.set(marker);
    test.equal(event[0], marker);
    test.done();
};

exports.subscribeValueChange = function(test) {
    test.expect(2);
    var event = null;
    var cell = new Cell();
    cell.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event, null);
    var marker = {};
    cell.set(marker);
    test.equal(event[0], marker);
    test.done();
};

exports.subscribeUse = function(test) {
    test.expect(2);
    var event = null;
    var cell = new Cell(42);
    cell.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event, null);

    cell.fix();
    test.equal(event[0], 42);

    test.done();
};