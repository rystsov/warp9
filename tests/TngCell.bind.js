var warp9 = require('../target/warp9.common');
var CellStore = require('./utils/TngCell.EventStore');

var Cell = warp9.core.cells.Cell;
var List = warp9.core.lists.List;
var DAG = warp9.core.dag.DAG;
var empty = warp9.empty;

exports.dag1 = function(test) {
    test.expect(4);
    test.equal(DAG.length, 0);

    var list = new List();

    var hasItem = list.reduceGroup({
        identity: function() { return 0; },
        add: function(a,b) { return a+b; },
        invert: function(x) { return -x; }
    }, {
        wrap: function() { return 1; },
        unwrap: function(x) { return x > 0; }
    });

    var left    = list.reduceGroup({
        identity: function() { return 0; },
        add: function(a,b) { return a+b; },
        invert: function(x) { return -x; }
    }, {
        wrap: function() { return 1; }
    });

    var dag = warp9.do(function(){
        return hasItem.get() ? left.get() : empty();
    });

    var store = new CellStore(dag);
    test.equal(store.changes, 1);
    test.ok(store.isEmpty());

    list.add("qwerty");
    test.ok(store.has(1));

    store.dispose();
    test.done();
};

exports.unary = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var add3 = warp9.do(function(){
        return cell.get() + 3;
    });

    var store = new CellStore(add3);
    test.equal(store.changes, 1);
    test.ok(store.isEmpty());

    cell.set(2);
    test.ok(store.has(5));

    store.dispose();
    test.equal(DAG.length, 0);

    test.done();
};

exports.binary = function(test) {
    test.expect(8);
    test.equal(DAG.length, 0);

    var a = new Cell(2);
    var b = new Cell(3);
    var c = warp9.do(function(){
        return a.get() + b.get();
    });
    test.equal(DAG.length, 0);

    var store = new CellStore(c);
    test.ok(store.has(5));

    a.set(4);
    test.ok(store.has(7));

    b.set(4);
    test.ok(store.has(8));

    store.dispose();
    test.equal(store.changes, 0);

    b.set(5);
    test.equal(store.changes, 0);

    test.equal(DAG.length, 0);
    test.done();
};

exports.binaryIntensive = function(test) {
    var A_CHANGES = 5;
    var B_CHANGES = 10;

    test.expect(5 + A_CHANGES*B_CHANGES);
    test.equal(DAG.length, 0);

    var a = new Cell(0);
    var b = new Cell(0);
    var c = warp9.do(function(){
        return a.get() + b.get();
    });
    var store = new CellStore(c);
    test.equal(DAG.length, 3);
    test.equal(store.changes, 1);
    test.ok(store.has(0));

    for(var i=0;i<A_CHANGES;i++) {
        a.set(i);
        for(var j=0;j<B_CHANGES;j++) {
            b.set(j);
            test.ok(store.has(i+j));
        }
    }

    store.dispose();
    test.equal(DAG.length, 0);
    test.done();
};

exports.getIntensive = function(test) {
    var A_CHANGES = 5;
    var B_CHANGES = 10;

    test.expect(3 + A_CHANGES*B_CHANGES);
    test.equal(DAG.length, 0);
    var a = new Cell(0);
    var b = new Cell(0);
    var c = warp9.do(function(){
        return a.get() + b.get();
    });
    test.equal(DAG.length, 0);

    for(var i=0;i<A_CHANGES;i++) {
        a.set(i);
        for(var j=0;j<B_CHANGES;j++) {
            b.set(j);
            test.equal(c.get(), i+j);
        }
    }

    test.equal(DAG.length, 0);
    test.done();
};