var rere = require('../rere.common');

var EventSink = require('./utils/Cell.EventSink');

var Cell = rere.reactive.Cell;

exports.when2 = function(test) {
    test.expect(4);

    var cell = new Cell();
    var when42 = cell.when(true, 42);
    when42.fix();
    var sink = new EventSink(when42);
    test.equal(sink.changes, 1);
    test.equal(sink.unwrap(0), 0);

    cell.set(true);
    test.equal(sink.changes, 2);
    test.equal(sink.unwrap(0), 42);

    test.done();
};

exports.when3 = function(test) {
    test.expect(7);

    var cell = new Cell();
    var when4213 = cell.when(true, 42, 13);
    when4213.fix();
    var sink1 = new EventSink(when4213);
    test.equal(sink1.changes, 1);
    test.equal(sink1.unwrap(0), 0);

    cell.set(true);
    test.equal(sink1.changes, 2);
    test.equal(sink1.unwrap(0), 42);

    cell.set(false);
    test.equal(sink1.changes, 3);
    test.equal(sink1.unwrap(0), 13);

    var sink2 = new EventSink(when4213);
    test.equal(sink2.unwrap(0), 13);


    test.done();
};

exports.whenFnCC = function(test) {
    test.expect(6);

    var cell = new Cell();
    var whenFn4213 = cell.when(function(x) { return x>0; }, 42, 13);
    whenFn4213.fix();

    var sink = new EventSink(whenFn4213);
    test.equal(sink.changes, 1);
    test.equal(sink.unwrap(0), 0);

    cell.set(0);
    test.equal(sink.changes, 2);
    test.equal(sink.unwrap(0), 13);

    cell.set(1);
    test.equal(sink.changes, 3);
    test.equal(sink.unwrap(0), 42);

    test.done();
};

exports.whenFnFnFn = function(test) {
    test.expect(6);

    var cell = new Cell();
    var whenFn4213 = cell.when(
        function(x) { return x>0; },
        function(x) { return x; },
        function(x) { return 2*x; }
    );
    whenFn4213.fix();

    var sink = new EventSink(whenFn4213);
    test.equal(sink.changes, 1);
    test.equal(sink.unwrap(0), 0);

    cell.set(-1);
    test.equal(sink.changes, 2);
    test.equal(sink.unwrap(0), -2);

    cell.set(1);
    test.equal(sink.changes, 3);
    test.equal(sink.unwrap(0), 1);

    test.done();
};

exports.doNotRaiseSetWhenValueIsTheSameAsLastSeen2 = function(test) {
    test.expect(6);

    var cell = new Cell();
    var when42 = cell.when(true, 42);
    when42.fix();
    var sink = new EventSink(when42);
    test.equal(sink.changes, 1);
    test.equal(sink.unwrap(0), 0);

    cell.set(true);
    test.equal(sink.changes, 2);
    test.equal(sink.unwrap(0), 42);

    cell.set(true);
    test.equal(sink.changes, 2);
    test.equal(sink.unwrap(0), 42);

    test.done();
};