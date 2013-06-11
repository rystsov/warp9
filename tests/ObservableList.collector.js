var rere = require('../rerejs/rere.common');

var ObservableList = rere.reactive.ObservableList;
var Variable = rere.reactive.Variable;
var adt = rere.adt;

exports.value = function(test){
    test.expect(3);
    
    var list = ObservableList.collector(function(add){
    	add.value(1);
    	add.value(2);
    });

    var values = list.values();
    test.equal(values.length, 2);
    test.equal(values[0], 1);
    test.equal(values[1], 2);
    test.done();
};

exports.rv = function(test){
    test.expect(8);
    
    var rv = new Variable(5);

    var list = ObservableList.collector(function(add){
        add.value(1);
        add.rv(rv);
    });

    var values = list.values();
    test.equal(values.length, 2);
    test.ok(values.indexOf(1)>=0);
    test.ok(values.indexOf(5)>=0);
    test.ok(values.indexOf(4)<0);

    rv.set(4)

    var values = list.values();
    test.equal(values.length, 2);
    test.ok(values.indexOf(1)>=0);
    test.ok(values.indexOf(4)>=0);
    test.ok(values.indexOf(5)<0);

    test.done();
};

exports.rvMaybeNone = function(test){
    test.expect(2);
    
    var rv = new Variable(new adt.maybe.None());

    var list = ObservableList.collector(function(add){
        add.value(1);
        add.rv.maybe(rv);
    });

    var values = list.values();
    test.equal(values.length, 1);
    test.ok(values.indexOf(1)>=0);

    test.done();
};

exports.rvMaybeSome = function(test){
    test.expect(3);
    
    var rv = new Variable(new adt.maybe.Some(5));

    var list = ObservableList.collector(function(add){
        add.value(1);
        add.rv.maybe(rv);
    });

    var values = list.values();
    test.equal(values.length, 2);
    test.ok(values.indexOf(1)>=0);
    test.ok(values.indexOf(5)>=0);

    test.done();
};

exports.rvMaybeUnset = function(test){
    test.expect(2);
    
    var rv = new Variable(new adt.maybe.Some(5));

    var list = ObservableList.collector(function(add){
        add.value(1);
        add.rv.maybe(rv);
    });

    rv.unset();

    var values = list.values();
    test.equal(values.length, 1);
    test.ok(values.indexOf(1)>=0);

    test.done();
};

