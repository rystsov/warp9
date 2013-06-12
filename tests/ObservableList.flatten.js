var rere = require('../rerejs/rere.common');
var checkObservableList = require('../testutils/ObservableList').checkObservableList;

var ObservableList = rere.reactive.ObservableList;
var Variable = rere.reactive.Variable;
var adt = rere.adt;


exports.list = function(test){
    test.expect(1);

    var volume = new ObservableList([]);

    var source1 = new ObservableList([]);
    var key1 = volume.addValue(source1);

    var source2 = new ObservableList([]);
    var key2 = volume.addValue(source2);

    var target = volume.flatten();

    checkObservableList(test, target, []);
    
    test.done();
};
