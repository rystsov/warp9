var rere = require('../rere.common');

var Cell = rere.reactive.Cell;
var List = rere.reactive.List;

exports.empty = function(test){
    test.expect(1);
    var list = new List([]);
    var reduced = list.reduce(0, function(a,b) { return a+b; });
    test.equal(0, reduced.unwrap(-1));
    test.done();
};

exports.pithy = function(test){
    test.expect(1);
    var list = new List([1,2,3]);
    var reduced = list.reduce(0, function(a,b) { return a+b; });
    test.equal(6, reduced.unwrap(-1));
    test.done();
};

exports.pithyCell = function(test){
    test.expect(1);
    var list = new List([new Cell(1), new Cell(2), new Cell(3)]);
    var reduced = list.reduce(0, function(a,b) { return a+b; });
    test.equal(6, reduced.unwrap(-1));
    test.done();
};

exports.ignoreUnsetFalse = function(test){
    test.expect(1);
    var list = new List([new Cell(1), new Cell()]);
    var reduced = list.reduce(0, function(a,b) { return a+b; });
    test.equal(-1, reduced.unwrap(-1));
    test.done();
};

exports.ignoreUnsetTrue = function(test){
    test.expect(1);
    var list = new List([new Cell(1), new Cell()]);
    var reduced = list.reduce(0, function(a,b) { return a+b; }, {ignoreUnset: true});
    test.equal(1, reduced.unwrap(-1));
    test.done();
};

exports.blickUnset = function(test){
    test.expect(2);
    var cell = new Cell();
    var list = new List([new Cell(1), cell]);
    var reduced = list.reduce(0, function(a,b) { return a+b; }, {ignoreUnset: true});
    test.equal(1, reduced.unwrap(-1));
    cell.set(2);
    test.equal(3, reduced.unwrap(-1));
    test.done();
};

exports.blick = function(test){
    test.expect(2);
    var cell = new Cell(2);
    var list = new List([new Cell(1), cell]);
    var reduced = list.reduce(0, function(a,b) { return a+b; }, {ignoreUnset: true});
    test.equal(3, reduced.unwrap(-1));
    cell.set(6);
    test.equal(7, reduced.unwrap(-1));
    test.done();
};

exports.zen = function(test){
    test.expect(1);
    test.ok(true, "world is great");
    test.done();
};