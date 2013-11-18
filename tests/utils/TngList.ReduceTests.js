var warp9 = require('../../target/warp9.common');

var Cell = warp9.core.cells.Cell;
var List = warp9.core.lists.List;
var ListStore = require('./TngList.EventStore');
var CellStore = require('./TngCell.EventStore');
var DAG = warp9.core.dag.DAG;

module.exports = ReducerTests;

function ReducerTests(reduce) {
    this.remove = function(test) {
        test.expect(5);
        test.equal(DAG.length, 0);

        var list = new List();
        var sum = reduce(list);

        var store = new CellStore(sum);
        test.ok(store.has(0));

        var key13 = list.add(13);
        test.ok(store.has(13));

        var key42 = list.add(42);
        test.ok(store.has(55));

        list.remove(key13);
        test.ok(store.has(42));

        store.dispose();
        test.done();
    };

    this.subscribeUsed = function(test) {
        test.expect(3);
        test.equal(DAG.length, 0);

        var list = new List();
        var sum = reduce(list);
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), 0);

        list.add(13);
        test.equal(store.unwrap(-1), 13);

        store.dispose();
        test.done();
    };

    this.subscribeUseLeave = function(test) {
        test.expect(7);
        test.equal(DAG.length, 0);

        var list = new List();
        var sum = reduce(list);
        test.equal(DAG.length, 0);

        var store = new CellStore(sum);
        test.equal(DAG.length, 2);
        test.equal(store.unwrap(-1), 0);

        list.add(13);
        test.equal(store.unwrap(-1), 13);

        store.dispose();
        test.equal(store.changes, 0);

        list.add(2);
        test.equal(store.changes, 0);
        test.done();
    };

    this.pithyCellUnwrap = function(test){
        test.expect(2);
        test.equal(DAG.length, 0);

        var list = new List([new Cell(1), new Cell(2), new Cell(3)]);
        var sum = reduce(list);
        test.equal(sum.unwrap(-1), 6);
        test.done();
    };

    this.pithyCellEvent = function(test){
        test.expect(2);
        test.equal(DAG.length, 0);

        var list = new List([new Cell(1), new Cell(2), new Cell(3)]);
        var sum = reduce(list);
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), 6);

        store.dispose();
        test.done();
    };

    this.ignoreUnsetFalseUnwrap = function(test){
        test.expect(2);
        test.equal(DAG.length, 0);

        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list);
        test.equal(sum.unwrap(-1), -1);
        test.done();
    };

    this.ignoreUnsetFalseEvent = function(test){
        test.expect(2);
        test.equal(DAG.length, 0);

        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list);
        var store = new CellStore(sum);
        test.ok(store.isEmpty());

        store.dispose();
        test.done();
    };

    this.ignoreUnsetTrueUnwrap = function(test){
        test.expect(2);
        test.equal(DAG.length, 0);

        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list, {ignoreUnset: true});
        test.equal(sum.unwrap(-1), 1);
        test.done();
    };

    this.ignoreUnsetTrueEvent = function(test){
        test.expect(2);
        test.equal(DAG.length, 0);

        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list, {ignoreUnset: true});
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), 1);

        store.dispose();
        test.done();
    };

    this.reduceImperfectDataCheckUnset = function(test) {
        test.expect(2);
        test.equal(DAG.length, 0);

        var cell1 = new Cell(1);
        var cell2 = new Cell();
        var list = new List([cell1, cell2]);
        var sum = reduce(list);
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), -1);

        store.dispose();
        test.done();
    };

    this.doubleUnsetEvent = function(test){
        test.expect(7);
        test.equal(DAG.length, 0);

        var cell1 = new Cell(1);
        var cell2 = new Cell(2);
        var list = new List([cell1, cell2]);
        var sum = reduce(list);
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), 3);
        test.equal(store.changes, 1);

        cell1.unset();
        test.equal(store.unwrap(-1), -1);
        test.equal(store.changes, 2);

        cell2.unset();
        test.equal(store.unwrap(-1), -1);
        test.equal(store.changes, 2);

        store.dispose();
        test.done();
    };

    this.reverseBlinkUnsetUnwrap = function(test){
        test.expect(3);
        test.equal(DAG.length, 0);

        var cell = new Cell(2);
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list, {ignoreUnset: true});
        test.equal(sum.unwrap(-1), 3);
        cell.unset();
        test.equal(sum.unwrap(-1), 1);
        test.done();
    };

    this.reverseBlinkUnsetEvent = function(test){
        test.expect(3);
        test.equal(DAG.length, 0);

        var cell = new Cell(2);
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list, {ignoreUnset: true});
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), 3);

        cell.unset();
        test.equal(store.unwrap(-1), 1);

        store.dispose();
        test.done();
    };

    this.blinkUnsetUnwrap = function(test){
        test.expect(3);
        test.equal(DAG.length, 0);

        var cell = new Cell();
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list, {ignoreUnset: true});
        test.equal(sum.unwrap(-1), 1);

        cell.set(2);
        test.equal(sum.unwrap(-1), 3);

        test.done();
    };

    this.blinkUnsetEvent = function(test){
        test.expect(3);
        test.equal(DAG.length, 0);

        var cell = new Cell();
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list, {ignoreUnset: true});
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), 1);

        cell.set(2);
        test.equal(store.unwrap(-1), 3);

        store.dispose();
        test.done();
    };

    this.blinkUnwrap = function(test){
        test.expect(3);
        test.equal(DAG.length, 0);

        var cell = new Cell(2);
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list);
        test.equal(sum.unwrap(-1), 3);

        cell.set(6);
        test.equal(sum.unwrap(-1), 7);

        test.done();
    };

    this.blinkEvent = function(test){
        test.expect(3);
        test.equal(DAG.length, 0);

        var cell = new Cell(2);
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list);
        var store = new CellStore(sum);
        test.equal(store.unwrap(-1), 3);

        cell.set(6);
        test.equal(store.unwrap(-1), 7);

        store.dispose();
        test.done();
    };

    this.checkDependencyOnRemove = function(test){
        test.expect(4);
        test.equal(DAG.length, 0);

        var list = new List();
        var cell1 = new Cell(1);
        var cell2 = new Cell(2);
        var key1 = list.add(cell1);
        var key2 = list.add(cell2);
        var sum = reduce(list);
        test.equal(DAG.length, 0);

        var store = new CellStore(sum);
        test.equal(DAG.length, 4);

        list.remove(key1);
        test.equal(DAG.length, 3);

        store.dispose();
        test.done();
    };

    this.checkDependencyOnSetData = function(test){
        test.expect(5);
        test.equal(DAG.length, 0);

        var list = new List();
        var cell1 = new Cell(1);
        var cell2 = new Cell(2);
        var cell3 = new Cell(3);
        var cell4 = new Cell(4);
        list.setData([cell1, cell2]);
        var sum = reduce(list);
        var store = new CellStore(sum);

        test.equal(DAG.length, 4);
        test.equal(store.unwrap(-1), 3);

        list.setData([cell3, cell4]);
        test.equal(DAG.length, 4);
        test.equal(store.unwrap(-1), 7);

        store.dispose();
        test.done();
    };
}    