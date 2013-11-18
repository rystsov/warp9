var warp9 = require('../target/warp9.common');
var CellStore = require('./utils/TngCell.EventStore');

var Cell = warp9.core.cells.Cell;
var DAG = warp9.core.dag.DAG;
var empty = warp9.tng.empty;

exports.pooling = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var or2 = cell.coalesce(2);
    test.equal(DAG.length, 0);
    test.equal(or2.unwrap(-1), 2);

    cell.set(1);
    test.equal(or2.unwrap(-1), 1);

    test.equal(DAG.length, 0);
    test.done();
};

exports.subscribeUseLeave = function(test) {
    test.expect(7);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var or2 = cell.coalesce(2);

    var store = new CellStore(or2);
    test.equal(DAG.length, 2);
    test.ok(store.has(2));

    cell.set(1);
    test.ok(store.has(1));

    store.dispose();
    test.equal(DAG.length, 0);
    test.equal(store.changes, 0);

    cell.set(2);
    test.equal(store.changes, 0);

    test.done();
};

exports.coalesceLift = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var or2 = cell.coalesce(2);
    var add3 = or2.lift(function(x){
        return x+3;
    });
    var store = new CellStore(add3);
    test.ok(store.has(5));

    store.dispose();
    test.equal(DAG.length, 0);
    test.equal(store.changes, 0);

    cell.set(2);
    test.equal(store.changes, 0);

    test.done();
};