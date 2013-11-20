var warp9 = require('../target/warp9.common');
var CellStore = require('./utils/Cell.EventStore');

var DAG = warp9.core.dag.DAG;

exports.notExponent = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var Cell = warp9.Cell;

    var a  = new Cell(0);
    var a1 = a.lift(function(a) { return a + 1; });
    var a2 = a.lift(function(a) { return a + 3; });

    var b  = warp9.do(function() { return a1.get() + a2.get(); });
    var b1 = b.lift(function(b) { return b + 5; });
    var b2 = b.lift(function(b) { return b + 7; });

    var c  = warp9.do(function() { return b1.get() + b2.get(); });
    var c1 = c.lift(function(c) { return c + 11; });
    var c2 = c.lift(function(c) { return c + 13; });

    var r  = warp9.do(function() { return c1.get() + c2.get(); });

    var store = new CellStore(r);
    test.equal(store.changes, 1);
    test.equal(store.get(-1), 64);

    a.set(1);
    test.equal(store.changes, 2);
    test.equal(store.get(-1), 72);

    store.dispose();
    test.done();
};
