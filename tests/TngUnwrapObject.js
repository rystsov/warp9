var warp9 = require('../target/warp9.common');

var List = warp9.core.lists.List;
var Cell = warp9.core.cells.Cell;

var unwrapObject = warp9.tng.unwrapObject;

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

