var rere = require('../rerejs/rere.common');

var ObservableList = rere.reactive.ObservableList;
var Variable = rere.reactive.Variable;
var adt = rere.adt;

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
