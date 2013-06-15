var rere = require('../rerejs/rere.common');
var checkObservableList = require('../testutils/ObservableList').checkObservableList;

var Variable = rere.reactive.Variable;
var rv = rere.reactive.rv;

exports.sequenceLeak = function(test){
    test.expect(6);

    var a = new Variable(1);
    var b = new Variable(2);
    test.equal(a["rere/reactive/Channel/dependants"].length, 0);
    test.equal(b["rere/reactive/Channel/dependants"].length, 0);
    
    var s = rv.sequence([a ,b]);
    test.equal(a["rere/reactive/Channel/dependants"].length, 1);
    test.equal(b["rere/reactive/Channel/dependants"].length, 1);

    s.dispose();
    test.equal(a["rere/reactive/Channel/dependants"].length, 0);
    test.equal(b["rere/reactive/Channel/dependants"].length, 0);
    
    test.done();
};

exports.sequenceMapLeak = function(test){
    test.expect(6);

    var a = new Variable(1);
    var b = new Variable(2);
    test.equal(a["rere/reactive/Channel/dependants"].length, 0);
    test.equal(b["rere/reactive/Channel/dependants"].length, 0);
    
    var s = rv.sequenceMap([a ,b], function(a,b){ return a+b; });
    test.equal(a["rere/reactive/Channel/dependants"].length, 1);
    test.equal(b["rere/reactive/Channel/dependants"].length, 1);

    s.dispose();
    test.equal(a["rere/reactive/Channel/dependants"].length, 0);
    test.equal(b["rere/reactive/Channel/dependants"].length, 0);
    
    test.done();
};