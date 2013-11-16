var warp9 = require('../target/warp9.common');

var Cell = warp9.tng.reactive.Cell;
var List = warp9.tng.reactive.lists.List;
var EventStore = require('./utils/TngList.EventStore');
var DAG = warp9.tng.dag.DAG;

exports.ctor = function(test) {
    test.expect(1);
    test.equal(DAG.length, 0);

    var list = new List();
    test.done();
};

exports.subscribeEmptyChange = function(test) {
    test.expect(7);
    test.equal(DAG.length, 0);

    var list = new List();
    var store = new EventStore(list);
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

exports.subscribeValueChange = function(test) {
    test.expect(6);
    test.equal(DAG.length, 0);

    var list = new List([42]);
    var store = new EventStore(list);
    test.equal(DAG.length, 1);
    test.equal(store.changes, 1);
    test.ok(store.equalTo([42]));

    list.add(13);
    test.ok(store.equalTo([42, 13]));
    store.dispose();
    test.equal(store.changes, 0);

    test.done();
};
