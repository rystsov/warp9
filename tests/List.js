var rere = require('../rere.common');
var EventSink = require('./utils/Cell.EventSink');
var EventStore = require('./utils/List.EventStore');
var List = rere.reactive.List;
var Cell = rere.reactive.Cell;

exports.ctor = function(test) {
    test.expect(0);
    var list = new List();
    test.done();
};

// TODO: uncomment
//exports.all = function(test) {
//    test.expect(4);
//
//    var list = new List();
//
//    var toggleAll = list.all(function(x) { return x.mark; }).fix();
//
//    var sink = new EventSink(toggleAll);
//    test.equal(sink.unwrap(0), true);
//
//    list.add({mark: new Cell(true)});
//    test.equal(sink.unwrap(0), true);
//
//    list.forEach(function(x) {x.mark.set(false); });
//    test.equal(sink.unwrap(0), false);
//
//    list.forEach(function(x) {x.mark.set(true); });
//    test.equal(sink.unwrap(0), true);
//
//    test.done();
//};

exports.subscribeUse = function(test) {
    test.expect(2);
    var list = new List([42]);
    var store = new EventStore();
    list.onEvent(List.handler(store));
    test.equal(store.changes, 0);

    list.fix();
    test.ok(store.play().has(42));

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
    list.fix();
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
    list.fix();
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

// TODO: uncomment
//exports.count = function(test) {
//    test.expect(3);
//    var list = new List().fix();
//    var count = list.count();
//    test.equal(count.unwrap(), 0);
//
//    var store = new EventStore();
//    list.onEvent(List.handler(store));
//    list.add(3);
//    var key = list.add(5);
//    list.add(7);
//    list.add(11);
//    test.equal(count.unwrap(), store.play().length);
//
//    list.remove(key);
//    test.equal(count.unwrap(), store.play().length);
//
//    test.done();
//};
