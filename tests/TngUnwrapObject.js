var warp9 = require('../target/warp9.common');

var List = warp9.core.lists.List;
var Cell = warp9.core.cells.Cell;

exports.unwrapCell = function(test) {
    test.expect(1);
    var unwrapped = warp9.unwrapObject(new Cell(42));
    test.equal(unwrapped.unwrap({ value: -1 }), 42);
    test.done();
};

exports.unwrapProperty = function(test) {
    test.expect(1);
    var obj = {
        value: new Cell(42)
    };
    var unwrapped = warp9.unwrapObject(obj);
    test.equal(unwrapped.unwrap({ value: -1 }).value, 42);
    test.done();
};

