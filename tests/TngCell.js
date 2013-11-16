var warp9 = require('../target/warp9.common');
var CellStore = require('./utils/TngCell.EventStore');

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
    test.expect(4);
    var cell = new Cell();
    var store = new CellStore(cell);
    test.equal(store.changes, 1);
    test.ok(store.isEmpty());

    cell.set(42);
    test.ok(store.has(42));

    store.dispose();
    cell.set(13);
    test.equal(store.changes, 0);

    test.done();
};

exports.subscribeValueChange = function(test) {
    test.expect(3);
    var cell = new Cell(42);
    var store = new CellStore(cell);
    test.equal(store.changes, 1);
    test.ok(store.has(42));

    cell.set(13);
    test.ok(store.has(13));

    test.done();
};

exports.doNotRaiseSetWhenValueIsTheSameAsLastSeen = function(test) {
    test.expect(6);

    var cell = new Cell(42);
    var store = new CellStore(cell);
    test.equal(store.changes, 1);
    test.equal(store.unwrap(0), 42);

    cell.set(13);
    test.equal(store.changes, 2);
    test.equal(store.unwrap(0), 13);

    cell.set(13);
    test.equal(store.changes, 2);
    test.equal(store.unwrap(0), 13);

    test.done();
};

exports.doNotRaiseUnsetWhenCellIsUnset = function(test) {
    test.expect(6);

    var cell = new Cell(42);
    var store = new CellStore(cell);
    test.equal(store.changes, 1);
    test.equal(store.unwrap(0), 42);

    cell.unset();
    test.equal(store.changes, 2);
    test.ok(store.isEmpty());

    cell.unset();
    test.equal(store.changes, 2);
    test.ok(store.isEmpty());

    test.done();
};