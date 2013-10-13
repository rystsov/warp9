var rere = require('../../rere.common');

var EventSink = require('./Cell.EventSink');
var List = rere.reactive.List;
var Cell = rere.reactive.Cell;

var idgenerator = rere.idgenerator;

module.exports = ReducerTests;

function ReducerTests(reduce) {
    this.subscribeUnused = function(test) {
        test.expect(5);
    
        var list = new List();
        var sum = reduce(list);
        test.equal(list.dependants.length, 0);
    
        var sink = new EventSink(sum);
    
        test.equal(sum.unwrap(), 0);
        list.add(1);
        test.equal(sum.unwrap(), 1);
    
        test.equal(list.dependants.length, 0);
        test.equal(sink.changes, 0);
        test.done();
    };
    
    this.subscribeUsed = function(test) {
        test.expect(2);
    
        var list = new List();
        var sum = reduce(list);
        sum.use(idgenerator());
    
        var sink = new EventSink(sum);
        test.equal(sink.unwrap(), 0);
    
        list.add(13);
        test.equal(sink.unwrap(), 13);
        test.done();
    };
    
    this.subscribeUseLeave = function(test) {
        test.expect(7);
    
        var list = new List();
        var sum = reduce(list);
        test.equal(list.dependants.length, 0);
    
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
    
        var id = idgenerator();
        sum.use(id);
        test.equal(list.dependants.length, 1);
        test.equal(sink.unwrap(), 0);
    
        list.add(13);
        test.equal(sink.unwrap(), 13);
    
        sum.leave(id);
        test.equal(list.dependants.length, 0);
    
        list.add(2);
        test.equal(sink.unwrap(), 13);
        test.done();
    };
    
    this.pithyCellUnwrap = function(test){
        test.expect(2);
        var list = new List([new Cell(1), new Cell(2), new Cell(3)]);
        var sum = reduce(list);
        test.equal(sum.unwrap(-1), 6);
        test.equal(list.dependants.length, 0);
        test.done();
    };
    
    this.pithyCellEvent = function(test){
        test.expect(2);
        var list = new List([new Cell(1), new Cell(2), new Cell(3)]);
        var sum = reduce(list);
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
    
        sum.use(idgenerator());
        test.equal(sink.unwrap(), 6);
        test.done();
    };
    
    this.ignoreUnsetFalseUnwrap = function(test){
        test.expect(1);
        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list);
        test.equal(sum.unwrap(-1), -1);
        test.done();
    };
    
    this.ignoreUnsetFalseEvent = function(test){
        test.expect(2);
        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list);
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
    
        sum.use(idgenerator());
        test.equal(sink.unwrap(-1), -1);
        test.done();
    };
    
    this.ignoreUnsetTrueUnwrap = function(test){
        test.expect(1);
        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list, {ignoreUnset: true});
        test.equal(sum.unwrap(-1), 1);
        test.done();
    };
    
    this.ignoreUnsetTrueEvent = function(test){
        test.expect(2);
        var list = new List([new Cell(1), new Cell()]);
        var sum = reduce(list, {ignoreUnset: true});
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
    
        sum.use(idgenerator());
        test.equal(sink.unwrap(-1), 1);
        test.done();
    };

    this.reduceImperfectDataCheckUnset = function(test) {
        test.expect(3);

        var cell1 = new Cell(1);
        var cell2 = new Cell();
        var list = new List([cell1, cell2]);
        var sum = reduce(list);
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);

        sum.use(idgenerator());
        test.equal(sink.changes, 1);
        test.equal(sink.unwrap(-1), -1);

        test.done();
    };

    this.doubleUnsetEvent = function(test){
        test.expect(7);
        var cell1 = new Cell(1);
        var cell2 = new Cell(2);
        var list = new List([cell1, cell2]);
        var sum = reduce(list);
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);

        sum.use(idgenerator());
        test.equal(sink.unwrap(-1), 3);
        test.equal(sink.changes, 1);

        cell1.unset();
        test.equal(sink.unwrap(-1), -1);
        test.equal(sink.changes, 2);

        cell2.unset();
        test.equal(sink.unwrap(-1), -1);
        test.equal(sink.changes, 2);

        test.done();
    };

    this.reverseBlinkUnsetUnwrap = function(test){
        test.expect(2);
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
        var cell = new Cell(2);
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list, {ignoreUnset: true});
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);

        sum.use(idgenerator());
        test.equal(sink.unwrap(-1), 3);

        cell.unset();
        test.equal(sink.unwrap(-1), 1);

        test.done();
    };

    this.blinkUnsetUnwrap = function(test){
        test.expect(2);
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
        var cell = new Cell();
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list, {ignoreUnset: true});
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
    
        sum.use(idgenerator());
        test.equal(sink.unwrap(-1), 1);
    
        cell.set(2);
        test.equal(sink.unwrap(-1), 3);
        test.done();
    };
    
    this.blinkUnwrap = function(test){
        test.expect(2);
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
        var cell = new Cell(2);
        var list = new List([new Cell(1), cell]);
        var sum = reduce(list);
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
    
        sum.use(idgenerator());
        test.equal(sink.unwrap(-1), 3);
    
        cell.set(6);
        test.equal(sink.unwrap(-1), 7);
        test.done();
    };
    
    this.checkDependencyOnRemove = function(test){
        test.expect(10);
        var list = new List();
        var cell1 = new Cell(1);
        var cell2 = new Cell(2);
        var key1 = list.add(cell1);
        var key2 = list.add(cell2);
        var sum = reduce(list);
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
        test.equal(list.dependants.length, 0);
        test.equal(cell1.dependants.length, 0);
        test.equal(cell2.dependants.length, 0);
    
        sum.use(idgenerator());
        test.equal(list.dependants.length, 1);
        test.equal(cell1.dependants.length, 1);
        test.equal(cell2.dependants.length, 1);
    
        list.remove(key1);
        test.equal(list.dependants.length, 1);
        test.equal(cell1.dependants.length, 0);
        test.equal(cell2.dependants.length, 1);
    
        test.done();
    };
    
    this.checkDependencyOnSetData = function(test){
        test.expect(14);
        var list = new List();
        var cell1 = new Cell(1);
        var cell2 = new Cell(2);
        var cell3 = new Cell(3);
        var cell4 = new Cell(4);
        list.setData([cell1, cell2]);
        var sum = reduce(list);
        var sink = new EventSink(sum);
        test.equal(sink.changes, 0);
        test.equal(list.dependants.length, 0);
        test.equal(cell1.dependants.length, 0);
        test.equal(cell2.dependants.length, 0);
    
        sum.use(idgenerator());
        test.equal(list.dependants.length, 1);
        test.equal(cell1.dependants.length, 1);
        test.equal(cell2.dependants.length, 1);
        test.equal(sink.unwrap(), 3);
    
        list.setData([cell3, cell4]);
        test.equal(list.dependants.length, 1);
        test.equal(cell1.dependants.length, 0);
        test.equal(cell2.dependants.length, 0);
        test.equal(cell3.dependants.length, 1);
        test.equal(cell4.dependants.length, 1);
        test.equal(sink.unwrap(), 7);
    
        test.done();
    };

}    