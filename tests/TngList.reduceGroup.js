var warp9 = require('../target/warp9.common');
var Summer = require('./utils/Summer');

var Cell = warp9.tng.reactive.Cell;
var List = warp9.tng.reactive.lists.List;

exports.ctor = function(test) {
    test.expect(0);
    var list = new List();
    test.done();
};

exports.blink = function(test) {
    test.expect(2);
    var a = new Cell(1);
    var b = new Cell(2);
    var list = new List([a, b]);

    var r = list.reduceGroup(new Summer());


    var event = null;
    var dispose = r.onChange(function(r){
        event = r.hasValue() ? [r.unwrap()] : [];
    });

    test.equal(event[0], 3);

    a.set(2);

    test.equal(event[0], 4);

    dispose();

    test.done();
};