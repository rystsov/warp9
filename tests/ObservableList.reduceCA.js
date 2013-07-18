var rere = require('../rerejs/rere.common');

var ObservableList = rere.reactive.ObservableList;
var Variable = rere.reactive.Variable;
var adt = rere.adt;

exports.empty = function(test){
    test.expect(1);

    var list = new ObservableList([]);

    var reduced = null;
    list.reduceCA(function(a,b){ throw new Error(); }).subscribe(function(value){
        throw new Error();
    });

    test.equal(reduced, null);
    test.done();
};

exports.default = function(test){
    test.expect(1);
    
    var list = new ObservableList([]);

    var reduced = null;
    list.reduceCA(function(a,b){ throw new Error(); }, 42).subscribe(function(value){
        reduced = value;
    });

    test.equal(reduced, 42);
    test.done();
};

exports.coalesce = function(test){
    test.expect(1);

    var list = new ObservableList([]);

    var reduced = null;
    list.reduceCA(function(a,b){ throw new Error(); }).coalesce(43).subscribe(function(value){
        reduced = value;
    });

    test.equal(reduced, 43);
    test.done();
};

exports.one = function(test){
    test.expect(1);

    var list = new ObservableList([new Variable(44)]);

    var reduced = null;
    list.reduceCA(function(a,b){ throw new Error(); }).subscribe(function(value){
        reduced = value;
    });

    test.equal(reduced, 44);
    test.done();
};