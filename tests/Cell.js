var rere = require('../rere.common');

var Cell = rere.reactive.Cell;

exports.subscribeToInited = function(test){
    test.expect(1);
    var got = null;
    var rv = new Cell(42);
    rv.subscribe(function(value){
        got = value;
    });
    test.equal(got, 42);
    test.done();
};

exports.lift = function(test){
    test.expect(2);

    var expect = [24, 46]
    var i=0;

    var a = new Cell(12);
    var b = a.lift(function(v) { return v*2; });

    b.subscribe(function(value){
        test.equal(expect[i++], value);
    });

    a.set(23);

    test.done();
};

exports.bind = function(test){
    test.expect(3);

    var expect = [4, 6, 7];
    var i=0;

    var a = new Cell(1);
    var b = new Cell(2);

    var c = a.bind(function(a){
        return b.bind(function(b){
            return new Cell(2*a+b);
        })
    });

    c.subscribe(function(value){
        test.equal(expect[i++], value);
    });

    a.set(2);
    b.set(3);

    test.done();
};