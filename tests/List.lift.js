var EventStore = require('./utils/List.EventStore');
var warp9 = require('../target/warp9.common');

var List = warp9.reactive.List;

var idgenerator = warp9.idgenerator;

exports.subscribeUnused = function(test) {
    test.expect(2);

    var list = new List([]);
    var add2 = list.lift(function(x){
        return x+2;
    });
    var store = new EventStore();
    add2.onEvent(List.handler(store));
    test.equal(store.changes, 0);
    list.add(1);
    test.equal(store.changes, 0);

    test.done();
};

exports.unwrap = function(test) {
    test.expect(4);

    var list = new List();
    var add2 = list.lift(function(x){
        return x+2;
    });
    list.add(1);
    test.equal(list.dependants.length, 0);
    var data = add2.unwrap();
    test.equal(data.length, 1);
    test.equal(data[0], 3);
    test.equal(list.dependants.length, 0);
    test.done();
};

exports.subscribeUsed = function(test) {
    test.expect(3);

    var data;
    var list = new List();
    var add2 = list.lift(function(x){
        return x+2;
    });
    add2.leak(idgenerator());
    var store = new EventStore();
    add2.onEvent(List.handler(store));
    test.equal(store.play().length, 0);
    list.add(1);
    data = store.play();
    test.equal(data.length, 1);
    test.ok(data.has(3));

    test.done();
};

exports.subscribeUseLeave = function(test) {
    test.expect(7);

    var list = new List();
    var add2 = list.lift(function(x){
        return x+2;
    });
    test.equal(list.dependants.length, 0);
    var id = idgenerator();
    add2.leak(id);
    test.equal(list.dependants.length, 1);
    var store = new EventStore();
    add2.onEvent(List.handler(store));
    test.equal(store.play().length, 0);
    list.add(1);
    var data = store.play();
    test.equal(data.length, 1);
    test.ok(data.has(3));
    add2.leave(id);
    test.equal(list.dependants.length, 0);
    list.add(2);
    test.equal(store.play().length, 1);

    test.done();
};

exports.doubleLift = function(test) {
    test.expect(6);

    var list = new List([2]);
    var add2 = list.lift(function(x){
        return x+2;
    });
    var add3 = add2.lift(function(x){
        return x+3;
    });
    test.equal(list.dependants.length, 0);
    var id = idgenerator();
    add3.leak(id);
    test.equal(list.dependants.length, 1);
    var store = new EventStore();
    add3.onEvent(List.handler(store));
    var data = store.play();
    test.equal(data.length, 1);
    test.ok(data.has(7));
    add3.leave(id);
    test.equal(list.dependants.length, 0);
    store.clear();
    list.add(2);
    test.equal(store.changes, 0);

    test.done();
};