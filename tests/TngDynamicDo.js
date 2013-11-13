var warp9 = require('../target/warp9.common');

var Cell = warp9.tng.reactive.Cell;
var DAG = warp9.tng.dag.DAG;

exports.ternary = function(test) {
    test.expect(11);

    var c  = new Cell();
    var b1 = new Cell(1);
    var b2 = new Cell(2);

    var r = warp9.tng.do(function(){
        return c.unwrap() ? b1.unwrap() : b2.unwrap();
    });

    var event = null;
    r.onChange(function(r){
        event = r.hasValue() ? [r.unwrap()] : [];
    });

    r.leak();
    test.equal(DAG.length, 2);
    test.equal(event.length, 0);

    c.set(true);
    test.equal(DAG.length, 3);
    test.equal(event[0], 1);

    b1.set(-1);
    test.equal(event[0], -1);

    c.set(false);
    test.equal(DAG.length, 3);
    test.equal(event[0], 2);

    b2.set(-2);
    test.equal(event[0], -2);

    c.unset();
    test.equal(DAG.length, 2);

    event = null;
    b1.set(10);
    b1.set(20);
    test.equal(event, null);

    r.seal();
    test.equal(DAG.length, 0);

    test.done();
};
