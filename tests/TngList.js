var warp9 = require('../target/warp9.common');

var Cell = warp9.tng.reactive.Cell;
var List = warp9.tng.reactive.lists.List;

exports.ctor = function(test) {
    test.expect(0);
    var list = new List();
    test.done();
};

exports.subscribeEmptyChange = function(test) {
    test.expect(4);
    var event = null;
    var list = new List();
    list.onEvent(function(change){
        event = change;
    });
    test.equal(event, null);

    list.add(42);
    test.equal(event, null);

    list.leak();
    test.equal(event.root.length, 1);
    test.equal(event.root[0].value, 42);

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
//
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
