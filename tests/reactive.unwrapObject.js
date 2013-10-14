var EventSink = require('./utils/Cell.EventSink');
var rere = require('../rere.common');

var List = rere.reactive.List;
var Cell = rere.reactive.Cell;

var unwrapObject = rere.reactive.utils.unwrapObject;

exports.unwrapCell = function(test) {
    test.expect(1);
    var unwrapped = unwrapObject(new Cell(42));
    test.equal(unwrapped.unwrap({ value: -1 }), 42);
    test.done();
};

exports.unwrapProperty = function(test) {
    test.expect(1);
    var obj = {
        value: new Cell(42)
    };
    var unwrapped = unwrapObject(obj);
    test.equal(unwrapped.unwrap({ value: -1 }).value, 42);
    test.done();
};

