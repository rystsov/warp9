var warp9 = require('../target/warp9.common');

var Cell = warp9.tng.reactive.Cell;

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
    test.expect(3);
    var event = null;
    var cell = new Cell();
    var dispose = cell.onChange(function(cell, message){
        event = cell.unwrap(null);
    });
    test.equal(event, null);

    var marker = {};
    cell.set(marker);
    test.equal(event, marker);

    dispose();
    event = null;
    cell.set(42);
    test.equal(event, null);

    test.done();
};

exports.subscribeValueChange = function(test) {
    test.expect(2);
    var event = null;
    var cell = new Cell(42);
    var dispose = cell.onChange(function(cell){
        event = cell.unwrap(null);
    });
    test.equal(event, 42);

    var marker = {};
    cell.set(marker);
    test.equal(event, marker);
    dispose();

    test.done();
};
