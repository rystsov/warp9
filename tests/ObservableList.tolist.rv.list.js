var rere = require('../rerejs/rere.common');
var checkObservableList = require('../testutils/ObservableList').checkObservableList;

var ObservableList = rere.reactive.ObservableList;
var Variable = rere.reactive.Variable;
var rv = rere.reactive.rv;

exports.empty = function(test){
    test.expect(1);
    
    var source = new ObservableList([]);
    var rvar = new Variable();
    var target = ObservableList.tolist.rv.list(rvar);
    rvar.set(source);

    checkObservableList(test, target, []);
    test.done();
};

exports.track = function(test){
    test.expect(1);
    
    var source = new ObservableList([]);
    var rvar = new Variable();
    var target = ObservableList.tolist.rv.list(rvar);
    rvar.set(source);

    source.add(function(){ return 1; });
    source.add(function(){ return 2; });

    checkObservableList(test, target, [1, 2]);
    test.done();
};

exports.unset = function(test){
    test.expect(2);
    
    var source = new ObservableList([]);
    var rvar = new Variable();
    var target = ObservableList.tolist.rv.list(rvar);
    rvar.set(source);

    source.add(function(){ return 1; });
    checkObservableList(test, target, [1]);

    rvar.unset();
    checkObservableList(test, target, []);
    
    test.done();
};

exports.reset = function(test){
    test.expect(2);
    
    var source1 = new ObservableList([]);
    var source2 = new ObservableList([]);
    var rvar = new Variable();
    var target = ObservableList.tolist.rv.list(rvar);
    
    rvar.set(source1);
    source1.add(function(){ return 1; });
    source2.add(function(){ return 2; });
    checkObservableList(test, target, [1]);

    rvar.set(source2);
    source1.add(function(){ return 3; });
    source2.add(function(){ return 4; });
    checkObservableList(test, target, [2, 4]);
    
    test.done();
};
