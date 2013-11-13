var warp9 = require('../target/warp9.common');

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
    test.expect(3);
    var event = null;
    var cell = new Cell();
    cell.onChange(function(cell){
        event = cell.unwrap(null);
    });
    test.equal(event, null);

    var marker = {};
    cell.set(marker);
    test.equal(event, null);

    cell.leak();
    test.equal(event, marker);

    test.done();
};

exports.subscribeValueChange = function(test) {
    test.expect(2);
    var event = null;
    var cell = new Cell();
    cell.leak();
    cell.onChange(function(cell){
        event = cell.unwrap(null);
    });
    test.equal(event, null);

    var marker = {};
    cell.set(marker);
    test.equal(event, marker);
    test.done();
};

exports.subscribeLeak = function(test) {
    test.expect(2);
    var event = null;
    var cell = new Cell(42);
    cell.onChange(function(cell){
        event = cell.unwrap(null);
    });
    test.equal(event, null);

    cell.leak();
    test.equal(event, 42);

    test.done();
};









//exports.doNotRaiseSetWhenValueIsTheSameAsLastSeen = function(test) {
//    test.expect(6);
//
//    var cell = new Cell(42);
//    cell.leak();
//
//    var sink = new EventSink(cell);
//    test.equal(sink.changes, 1);
//    test.equal(sink.unwrap(0), 42);
//
//    cell.set(13);
//    test.equal(sink.changes, 2);
//    test.equal(sink.unwrap(0), 13);
//
//    cell.set(13);
//    test.equal(sink.changes, 2);
//    test.equal(sink.unwrap(0), 13);
//
//    test.done();
//};
//
//exports.doNotRaiseUnsetWhenCellIsUnset = function(test) {
//    test.expect(6);
//
//    var cell = new Cell(42);
//    cell.leak();
//
//    var sink = new EventSink(cell);
//    test.equal(sink.changes, 1);
//    test.equal(sink.unwrap(0), 42);
//
//    cell.unset();
//    test.equal(sink.changes, 2);
//    test.equal(sink.unwrap(0), 0);
//
//    cell.unset();
//    test.equal(sink.changes, 2);
//    test.equal(sink.unwrap(0), 0);
//
//    test.done();
//};