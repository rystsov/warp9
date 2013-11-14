var warp9 = require('../target/warp9.common');

var Cell = warp9.tng.reactive.Cell;
var List = warp9.tng.reactive.lists.List;
var EventStore = require('./utils/TngList.EventStore');

exports.ctor = function(test) {
    test.expect(0);
    var list = new List();
    test.done();
};

exports.subscribeEmptyChange = function(test) {
    test.expect(4);

    var list = new List();
    var store = new EventStore(list);
    test.equal(store.changes, 0);

    list.add(42);
    test.equal(store.changes, 0);

    list.leak();
    var data = store.play();

    test.equal(data.length, 1);
    test.ok(data.has(42));

    test.done();
};

exports.subscribeEmptyChangeChange = function(test) {
    test.expect(5);

    var list = new List();
    var store = new EventStore(list);
    test.equal(store.changes, 0);

    list.add(42);
    test.equal(store.changes, 0);

    list.leak();
    list.add(13);

    var data = store.play();

    test.equal(data.length, 2);
    test.ok(data.has(13));
    test.ok(data.has(42));

    test.done();
};

//exports.subscribeValueChange = function(test) {
//    test.expect(2);
//    var event = null;
//    var cell = new Cell();
//    cell.leak();
//    cell.onChange(function(cell){
//        event = cell.unwrap(null);
//    });
//    test.equal(event, null);
//
//    var marker = {};
//    cell.set(marker);
//    test.equal(event, marker);
//    test.done();
//};

//exports.subscribeLeak = function(test) {
//    test.expect(2);
//    var event = null;
//    var cell = new Cell(42);
//    cell.onChange(function(cell){
//        event = cell.unwrap(null);
//    });
//    test.equal(event, null);
//
//    cell.leak();
//    test.equal(event, 42);
//
//    test.done();
//};
