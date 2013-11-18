var warp9 = require('../target/warp9.common');

var Cell = warp9.core.cells.Cell;
var List = warp9.core.lists.List;
var ListStore = require('./utils/TngList.EventStore');
var DAG = warp9.core.dag.DAG;

exports.ctor = function(test) {
    test.expect(1);
    test.equal(DAG.length, 0);

    var list = new List();
    var lifted = list.lift(function(x){
        return x + 2;
    });
    list.add(1);

    test.done();
};

exports.unwrap = function(test) {
    test.expect(2);
    test.equal(DAG.length, 0);

    var list = new List();
    var add2 = list.lift(function(x){
        return x+2;
    });
    list.add(1);
    test.deepEqual(add2.get(), [3]);

    test.done();
};

exports.subscribe = function(test) {
    test.expect(6);
    test.equal(DAG.length, 0);

    var list = new List();
    var add2 = list.lift(function(x){
        return x+2;
    });
    test.equal(DAG.length, 0);

    var store = new ListStore(add2);
    test.ok(store.isEmpty());

    list.add(1);
    test.deepEqual(store.data(), [3]);

    store.dispose();
    test.equal(DAG.length, 0);

    list.add(2);
    test.equal(store.changes, 0);

    test.done();
};

exports.add = function(test) {
    test.expect(2);
    test.equal(DAG.length, 0);

    var list = new List([]);
    var add1 = list.lift(function(x){ return x + 1; });
    var store = new ListStore(add1);
    list.add(3);
    list.add(5);
    list.add(7);
    list.add(11);
    test.ok(store.equalTo([4,6,8,12]));

    store.dispose();
    test.done();
};

exports.addRemove = function(test) {
    test.expect(3);
    test.equal(DAG.length, 0);

    var list = new List();
    var add1 = list.lift(function(x){ return x + 1; });
    var store = new ListStore(add1);
    list.add(3);
    var key = list.add(5);
    list.add(7);
    list.add(11);
    test.ok(store.equalTo([4,6,8,12]));

    list.remove(key);
    test.ok(store.equalTo([4,8,12]));

    store.dispose();
    test.done();
};

exports.doubleLift = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var list = new List([2]);
    var add2 = list.lift(function(x){
        return x+2;
    });
    var add3 = add2.lift(function(x){
        return x+3;
    });
    var store = new ListStore(add3);
    test.equal(DAG.length, 3);
    test.deepEqual(store.data(), [7]);

    store.dispose();
    test.equal(DAG.length, 0);

    list.add(2);
    test.equal(store.changes, 0);

    test.done();
};

exports.fork = function(test) {
    test.expect(12);
    test.equal(DAG.length, 0);

    var list = new List([2]);
    var add2 = list.lift(function(x){
        return x+2;
    });
    var add3 = list.lift(function(x){
        return x+3;
    });
    test.equal(DAG.length, 0);

    var store3 = new ListStore(add3);
    test.equal(DAG.length, 2);
    test.deepEqual(store3.data(), [5]);

    var store2 = new ListStore(add2);
    test.equal(DAG.length, 3);
    test.deepEqual(store2.data(), [4]);

    list.add(3);
    test.deepEqual(store3.data(), [5, 6]);
    test.deepEqual(store2.data(), [4, 5]);

    store3.dispose();
    test.equal(DAG.length, 2);

    list.add(5);
    test.ok(store3.isEmpty() && store3.changes==0);
    test.deepEqual(store2.data(), [4, 5, 7]);

    store2.dispose();
    test.equal(DAG.length, 0);

    test.done();
};