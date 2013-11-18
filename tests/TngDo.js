var warp9 = require('../target/warp9.common');
var CellStore = require('./utils/TngCell.EventStore');

var Cell = warp9.tng.reactive.Cell;
var DAG = warp9.tng.dag.DAG;

// TODO: useless test?
exports.emptyUpdate = function(test) {
    test.expect(3);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    test.equal(add2.unwrap(null), null);
    cell.set(1);
    test.equal(add2.unwrap(null), 3);

    test.done();
};

exports.valueUpdate = function(test) {
    test.expect(2);
    test.equal(DAG.length, 0);

    var cell = new Cell(1);
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    cell.set(2);
    test.equal(add2.unwrap(), 4);

    test.done();
};

exports.subscribe = function(test) {
    test.expect(3);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    var store = new CellStore(add2);
    test.ok(store.isEmpty() && store.changes==1);

    cell.set(1);
    test.ok(store.has(3));
    store.dispose();

    test.done();
};

exports.subscribeUseLeave = function(test) {
    test.expect(8);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    test.equal(DAG.length, 0);

    var store = new CellStore(add2);
    test.equal(DAG.length, 2);
    test.ok(store.isEmpty() && store.changes==1);

    cell.set(1);
    test.ok(store.has(3));

    store.dispose();
    test.equal(DAG.length, 0);
    test.equal(store.changes, 0);

    cell.set(2);
    test.equal(store.changes, 0);

    test.done();
};

exports.doubleLift = function(test) {
    test.expect(7);
    test.equal(DAG.length, 0);

    var cell = new Cell(2);
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    var add3 = warp9.tng.do(function(){
        return add2.unwrap()+3;
    });
    test.equal(DAG.length, 0);

    var store = new CellStore(add3);
    test.equal(DAG.length, 3);
    test.ok(store.has(7));

    store.dispose();
    test.equal(DAG.length, 0);
    test.equal(store.changes, 0);

    cell.set(2);
    test.equal(store.changes, 0);

    test.done();
};

exports.fork = function(test) {
    test.expect(12);
    test.equal(DAG.length, 0);

    var cell = new Cell(2);
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    var add3 = warp9.tng.do(function(){
        return cell.unwrap()+3;
    });
    test.equal(DAG.length, 0);

    var store3 = new CellStore(add3);
    test.equal(DAG.length, 2);
    test.ok(store3.has(5));

    var store2 = new CellStore(add2);
    test.equal(DAG.length, 3);
    test.ok(store2.has(4));

    cell.set(3);
    test.ok(store3.has(6));
    test.ok(store2.has(5));

    store3.dispose();
    test.equal(DAG.length, 2);

    cell.set(4);
    test.ok(store3.isEmpty() && store3.changes==0);
    test.ok(store2.has(6));

    store2.dispose();
    test.equal(DAG.length, 0);

    test.done();
};

exports.ternary = function(test) {
    test.expect(12);
    test.equal(DAG.length, 0);

    var c  = new Cell();
    var b1 = new Cell(1);
    var b2 = new Cell(2);

    var r = warp9.tng.do(function(){
        return c.unwrap() ? b1.unwrap() : b2.unwrap();
    });

    var store = new CellStore(r);
    test.equal(DAG.length, 2);
    test.ok(store.isEmpty() && store.changes==1);

    c.set(true);
    test.equal(DAG.length, 3);
    test.ok(store.has(1));

    b1.set(-1);
    test.ok(store.has(-1));

    c.set(false);
    test.equal(DAG.length, 3);
    test.ok(store.has(2));

    b2.set(-2);
    test.ok(store.has(-2));

    c.unset();
    test.equal(DAG.length, 2);

    var changes = store.changes;
    b1.set(10);
    b1.set(20);
    test.equal(store.changes, changes);

    store.dispose();
    test.equal(DAG.length, 0);

    test.done();
};

exports.nested = function(test) {
    test.expect(7);
    test.equal(DAG.length, 0);

    var a = new Cell();
    var b = new Cell();
    var o = new Cell(2);
    var r = warp9.tng.do(function(){
        var inner = a.unwrap();
        var v = warp9.tng.do(function(){
            return inner.unwrap()+2;
        }).unwrap();
        return v + o.unwrap();
    });

    var store = new CellStore(r);
    test.equal(DAG.length, 2); // r, a

    a.set(b);
    test.equal(DAG.length, 4); // r, a, inner (b), inner-do

    b.set(1);
    test.equal(DAG.length, 5); // r, a, inner (b), inner-do, o
    test.equal(store.unwrap(-1), 5);

    b.unset();
    test.equal(DAG.length, 4); // r, a, inner (b), inner-do

    a.unset();
    test.equal(DAG.length, 2);

    store.dispose();
    test.done();
};