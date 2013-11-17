var warp9 = require('../target/warp9.common');

var Cell = warp9.tng.reactive.Cell;
var List = warp9.tng.reactive.lists.List;
var ListStore = require('./utils/TngList.EventStore');
var CellStore = require('./utils/TngCell.EventStore');
var DAG = warp9.tng.dag.DAG;

exports.ctor = function(test) {
    test.expect(1);
    test.equal(DAG.length, 0);

    var list = new List();
    test.done();
};

exports.subscribeValueChange = function(test) {
    test.expect(6);
    test.equal(DAG.length, 0);

    var list = new List([42]);
    var store = new ListStore(list);
    test.equal(DAG.length, 1);
    test.equal(store.changes, 1);
    test.ok(store.equalTo([42]));

    list.add(13);
    test.ok(store.equalTo([42, 13]));
    store.dispose();
    test.equal(store.changes, 0);

    test.done();
};

exports.subscribeEmptyChange = function(test) {
    test.expect(7);
    test.equal(DAG.length, 0);

    var list = new List();
    var store = new ListStore(list);
    test.equal(DAG.length, 1);
    test.equal(store.changes, 1);

    list.add(42);
    test.equal(store.changes, 2);
    test.ok(store.equalTo([42]));

    store.dispose();
    test.equal(DAG.length, 0);
    list.add(13);
    test.equal(store.changes, 0);

    test.done();
};

exports.add = function(test) {
    test.expect(2);
    test.equal(DAG.length, 0);

    var list = new List([]);
    var store = new ListStore(list);
    list.add(3);
    list.add(5);
    list.add(7);
    list.add(11);
    test.ok(store.equalTo([3,5,7,11]));

    store.dispose();
    test.done();
};

exports.addRemove = function(test) {
    test.expect(3);
    test.equal(DAG.length, 0);

    var list = new List();
    var store = new ListStore(list);
    list.add(3);
    var key = list.add(5);
    list.add(7);
    list.add(11);
    test.ok(store.equalTo([3,5,7,11]));

    list.remove(key);
    test.ok(store.equalTo([3,7,11]));

    store.dispose();
    test.done();
};

exports.all = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var list = new List();

    var toggleAll = list.all(function(x) { return x.mark; });

    var store = new CellStore(toggleAll);
    test.ok(store.has(true));

    list.add({mark: new Cell(true)});
    test.ok(store.has(true));

    list.forEach(function(x) {x.mark.set(false); });
    test.ok(store.has(false));

    list.forEach(function(x) {x.mark.set(true); });
    test.ok(store.has(true));

    store.dispose();
    test.done();
};

exports.count = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var list = new List();
    var count = list.count();
    test.equal(count.unwrap(), 0);

    var store = new CellStore(count);
    test.ok(store.has(0));

    list.add(3);
    var key = list.add(5);
    list.add(7);
    list.add(11);
    test.ok(store.has(4));

    list.remove(key);
    test.ok(store.has(3));

    store.dispose();
    test.done();
};