var rere = require('../rere.common');

var Cell = rere.reactive.Cell;
var GC = rere.reactive.GC;

exports.collect = function(test){
    test.expect(2);

    var a = new Cell(2).name("a");
    var b = new Cell(1).name("b");

    var c = a.bind(function(a) {
        return b.bind(function(b) {
            return new Cell(a + 2 * b).name("b-bind");
        }).name("a-bind");
    }).name("c");
    c.isUsed = true;

    var objects = GC.count(a,b);
    a.set(3);
    a.set(4);
    a.set(5);
    a.set(6);
    b.set(7);

    test.ok(objects < GC.count(a,b))
    GC.collect(a, b);
    test.ok(objects == GC.count(a,b))

    test.done();
};

exports.liftGarbage = function(test){
    test.expect(3);

    var a = new Cell(1);
    var b = a.lift(function(v) { return v*2; });

    test.equal(2, b.unwrap());
    GC.collect(a, b);
    a.set(2);
    test.equal(2, b.unwrap());
    b.activate();
    test.equal(4, b.unwrap());

    test.done();
};

exports.lift = function(test){
    test.expect(2);

    var a = new Cell(1);
    var b = a.lift(function(v) { return v*2; });
    b.isUsed = true;

    test.equal(2, b.unwrap());
    GC.collect(a, b);
    a.set(2);
    test.equal(4, b.unwrap());

    test.done();
};

exports.bindGarbage = function(test){
    test.expect(3);

    var a = new Cell(1);
    var b = new Cell(2);
    var c = a.bind(function(a){
        return b.bind(function(b){
            return new Cell(2*a+b);
        })
    });

    test.equal(4, c.unwrap());
    GC.collect(a, b, c);
    a.set(2);
    b.set(4);
    test.equal(4, c.unwrap());
    c.activate();
    test.equal(8, c.unwrap());

    test.done();
};

exports.bind = function(test){
    test.expect(2);

    var a = new Cell(1);
    var b = new Cell(2);
    var c = a.bind(function(a){
        return b.bind(function(b){
            return new Cell(2*a+b);
        })
    });
    c.isUsed = true;

    test.equal(4, c.unwrap());
    GC.collect(a, b, c);
    a.set(2);
    b.set(4);
    test.equal(8, c.unwrap());

    test.done();
};