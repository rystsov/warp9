var warp9 = require('../target/warp9.common');
var CellStore = require('./utils/Cell.EventStore');

var DAG = warp9.core.dag.DAG;

exports.ctor = function(test) {
    test.expect(1);
    test.equal(DAG.length, 0);

    var cell = new warp9.Cell();
    test.done();
};

exports.getValue = function(test) {
    test.expect(2);
    test.equal(DAG.length, 0);

    var value = {};
    var cell = new warp9.Cell(value);
    test.equal(cell.get(), value);
    test.done();
};

exports.getEmpty = function(test) {
    test.expect(2);
    test.equal(DAG.length, 0);

    var marker = {};
    var cell = new warp9.Cell();
    test.equal(cell.get(marker), marker);
    test.done();
};

exports.doubleSubscribe = function(test) {
    test.equal(DAG.length, 0);

    var cell = new warp9.Cell(42);
    var store1 = new CellStore(cell);
    var store2 = new CellStore(cell);
    store1.dispose();
    store2.dispose();

    test.done();
};

exports.subscribeEmptyChange = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var cell = new warp9.Cell();
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
    test.expect(4);
    test.equal(DAG.length, 0);

    var cell = new warp9.Cell(42);
    var store = new CellStore(cell);
    test.equal(store.changes, 1);
    test.ok(store.has(42));

    cell.set(13);
    test.ok(store.has(13));

    store.dispose();
    test.done();
};

exports.doNotRaiseSetWhenValueIsTheSameAsLastSeen = function(test) {
    test.expect(7);
    test.equal(DAG.length, 0);

    var cell = new warp9.Cell(42);
    var store = new CellStore(cell);
    test.equal(store.changes, 1);
    test.equal(store.get(0), 42);

    cell.set(13);
    test.equal(store.changes, 2);
    test.equal(store.get(0), 13);

    cell.set(13);
    test.equal(store.changes, 2);
    test.equal(store.get(0), 13);

    store.dispose();
    test.done();
};

exports.doNotRaiseUnsetWhenCellIsUnset = function(test) {
    test.expect(7);
    test.equal(DAG.length, 0);

    var cell = new warp9.Cell(42);
    var store = new CellStore(cell);
    test.equal(store.changes, 1);
    test.equal(store.get(0), 42);

    cell.unset();
    test.equal(store.changes, 2);
    test.ok(store.isEmpty());

    cell.unset();
    test.equal(store.changes, 2);
    test.ok(store.isEmpty());

    store.dispose();
    test.done();
};