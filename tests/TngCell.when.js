var warp9 = require('../target/warp9.common');
var CellStore = require('./utils/TngCell.EventStore');

var Cell = warp9.core.cells.Cell;
var DAG = warp9.core.dag.DAG;
var empty = warp9.empty;

exports.repeatEventOnLeak = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var activeTab = new Cell("All");
    var completed = activeTab.when("Completed", "selected");

    var store = new CellStore(completed);
    test.ok(store.isEmpty() && store.changes==1);

    activeTab.set("Completed");
    test.ok(store.has("selected"));
    test.equal(store.changes, 2); // "set" event

    store.dispose();
    store = new CellStore(completed);
    test.ok(store.has("selected") && store.changes==1);

    store.dispose();
    test.done();
};

exports.when1 = function(test) {
    test.expect(6);
    test.equal(DAG.length, 0);

    var a = new Cell();
    var b = a.when(function(a) {
        return a>3 ;
    });
    var store = new CellStore(b);
    test.ok(store.isEmpty() && store.changes==1);

    a.set(42);
    test.ok(store.has(42) && store.changes==2);

    a.set(4);
    test.ok(store.has(4) && store.changes==3);

    a.set(1);
    test.ok(store.isEmpty() && store.changes==4);

    a.set(4);
    test.ok(store.has(4) && store.changes==5);

    store.dispose();
    test.done();
};

exports.when2 = function(test) {
    test.expect(3);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var when42 = cell.when(true, 42);

    var store = new CellStore(when42);
    test.ok(store.isEmpty() && store.changes==1);

    cell.set(true);
    test.ok(store.has(42) && store.changes==2);

    store.dispose();
    test.done();
};

exports.when3 = function(test) {
    test.expect(5);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var when4213 = cell.when(true, 42, 13);

    var store1 = new CellStore(when4213);
    test.ok(store1.isEmpty());

    cell.set(true);
    test.ok(store1.has(42));

    cell.set(false);
    test.ok(store1.has(13));

    var store2 = new CellStore(when4213);
    test.ok(store2.has(13));

    store1.dispose();
    store2.dispose();
    test.done();
};

exports.whenFnCC = function(test) {
    test.expect(4);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var whenFn4213 = cell.when(function(x) { return x>0; }, 42, 13);

    var store = new CellStore(whenFn4213);
    test.ok(store.isEmpty());

    cell.set(0);
    test.ok(store.has(13));

    cell.set(1);
    test.ok(store.has(42));

    store.dispose();
    test.done();
};

exports.whenFnFnFn = function(test) {
    test.expect(4);
    test.equal(DAG.length, 0);

    var cell = new Cell();
    var whenFn4213 = cell.when(
        function(x) { return x>0; },
        function(x) { return x; },
        function(x) { return 2*x; }
    );

    var store = new CellStore(whenFn4213);
    test.ok(store.isEmpty());

    cell.set(-1);
    test.ok(store.has(-2));

    cell.set(1);
    test.ok(store.has(1));

    store.dispose();
    test.done();
};

exports.doNotRaiseSetWhenValueIsTheSameAsLastSeen2 = function(test) {
    test.expect(6);

    var cell = new Cell();
    var when42 = cell.when(true, 42);

    var store = new CellStore(when42);
    test.equal(store.changes, 1);
    test.ok(store.isEmpty());

    cell.set(true);
    test.equal(store.changes, 2);
    test.ok(store.has(42));

    cell.set(true);
    test.equal(store.changes, 2);
    test.ok(store.has(42));

    store.dispose();
    test.done();
};