var warp9 = require('../target/warp9.common');

var Cell = warp9.tng.reactive.Cell;
var DAG = warp9.tng.dag.DAG;

// TODO: useless test?
exports.emptyUpdate = function(test) {
    test.expect(2);

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
    test.expect(1);

    var cell = new Cell(1);
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    cell.set(2);
    test.equal(add2.unwrap(), 4);

    test.done();
};

exports.subscribe = function(test) {
    test.expect(2);

    var cell = new Cell();
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    var event = null;
    var dispose = add2.onChange(function(add2){
        event = add2.hasValue() ? [add2.unwrap()] : [];
    });
    test.equal(event.length, 0);
    cell.set(1);
    test.equal(event[0], 3);
    dispose();

    test.done();
};

exports.subscribeUseLeave = function(test) {
    DAG.reset();
    test.expect(6);

    var cell = new Cell();
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    test.equal(DAG.length, 0);
    var event = null;
    var dispose = add2.onChange(function(add2){
        event = add2.hasValue() ? [add2.unwrap()] : [];
    });
    test.equal(DAG.length, 2);
    test.equal(event.length, 0);
    cell.set(1);
    test.equal(event[0], 3);
    dispose();
    test.equal(DAG.length, 0);
    event = null;
    cell.set(2);
    test.equal(event, null);

    test.done();
};

exports.doubleLift = function(test) {
    DAG.reset();
    test.expect(5);

    var cell = new Cell(2);
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    var add3 = warp9.tng.do(function(){
        return add2.unwrap()+3;
    });
    test.equal(DAG.length, 0);

    var event = null;
    var dispose = add3.onChange(function(add3){
        event = add3.hasValue() ? [add3.unwrap()] : [];
    });
    test.equal(DAG.length, 3);
    test.equal(event[0], 7);

    dispose();
    test.equal(DAG.length, 0);

    event = null;
    cell.set(2);
    test.equal(event, null);

    test.done();
};

exports.fork = function(test) {
    DAG.reset();
    test.expect(11);

    var cell = new Cell(2);
    var add2 = warp9.tng.do(function(){
        return cell.unwrap()+2;
    });
    var add3 = warp9.tng.do(function(){
        return cell.unwrap()+3;
    });
    test.equal(DAG.length, 0);

    var event3 = null;
    var dispose3 = add3.onChange(function(add3){
        event3 = add3.hasValue() ? [add3.unwrap()] : [];
    });
    test.equal(event3[0], 5);
    test.equal(DAG.length, 2);

    var event2 = null;
    var dispose2 = add2.onChange(function(add2){
        event2 = add2.hasValue() ? [add2.unwrap()] : [];
    });
    test.equal(DAG.length, 3);
    test.equal(event2[0], 4);

    cell.set(3);
    test.equal(event3[0], 6);
    test.equal(event2[0], 5);

    dispose3();
    test.equal(DAG.length, 2);
    cell.set(4);
    test.equal(event3[0], 6);
    test.equal(event2[0], 6);

    dispose2();
    test.equal(DAG.length, 0);

    test.done();
};