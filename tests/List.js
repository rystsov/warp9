var EventStore = require('./utils/List.EventStore');
var rere = require('../rere.common');

var List = rere.reactive.List;

exports.ctor = function(test) {
    test.expect(0);
    var list = new List([]);
    test.done();
};

exports.add = function(test) {
    test.expect(5);
    var list = new List([]);
    var store = new EventStore();
    list.onEvent(List.handler(store));
    list.add(3);
    list.add(5);
    list.add(7);
    list.add(11);
    var data = store.play();
    test.equal(data.length, 4);
    test.ok(data.has(3));
    test.ok(data.has(5));
    test.ok(data.has(7));
    test.ok(data.has(11));

    test.done();
};

exports.addRemove = function(test) {
    test.expect(5);
    var list = new List([]);
    var store = new EventStore();
    list.onEvent(List.handler(store));
    list.add(3);
    var key = list.add(5);
    list.add(7);
    list.add(11);
    var data = store.play();
    test.equal(data.length, 4);
    list.remove(key);
    data = store.play();
    test.equal(data.length, 3);

    test.ok(data.has(3));
    test.ok(data.has(7));
    test.ok(data.has(11));

    test.done();
};

exports.count = function(test) {
    test.expect(3);
    var list = new List([]);
    var count = list.count();
    test.equal(count.unwrap(), 0);

    var store = new EventStore();
    list.onEvent(List.handler(store));
    list.add(3);
    var key = list.add(5);
    list.add(7);
    list.add(11);
    test.equal(count.unwrap(), store.play().length);

    list.remove(key);
    test.equal(count.unwrap(), store.play().length);

    test.done();
};