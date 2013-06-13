var rere = require('../rerejs/rere.common');
var checkObservableList = require('../testutils/ObservableList').checkObservableList;

var ObservableList = rere.reactive.ObservableList;
var Variable = rere.reactive.Variable;
var adt = rere.adt;

exports.init = function(test) {
    test.expect(1);

    var volume = new ObservableList([]);

    var source1 = new ObservableList([1, 2]);
    volume.addValue(source1);

    var source2 = new ObservableList([3]);
    volume.addValue(source2);

    var target = volume.flatten();

    checkObservableList(test, target, [1, 2, 3]);

    test.done();
};

exports.add = function(test) {
    test.expect(1);

    var volume = new ObservableList([]);

    var source1 = new ObservableList([]);
    volume.addValue(source1);

    var source2 = new ObservableList([]);
    volume.addValue(source2);

    var target = volume.flatten();

    source1.addValue(1);
    source1.addValue(2);
    source2.addValue(3);

    checkObservableList(test, target, [1, 2, 3]);

    test.done();
};

exports.remove = function(test){
    test.expect(1);

    var volume = new ObservableList([]);

    var source1 = new ObservableList([]);
    volume.addValue(source1);

    var source2 = new ObservableList([]);
    volume.addValue(source2);

    var target = volume.flatten();

    var key11 = source1.addValue(1);
    var key12 = source1.addValue(2);
    var key21 = source2.addValue(3);
    source1.remove(key12);

    checkObservableList(test, target, [1, 3]);

    test.done();
};

exports.removeBatch = function(test){
    test.expect(1);

    var volume = new ObservableList([]);

    var source1 = new ObservableList([]);
    var key1 = volume.addValue(source1);

    var source2 = new ObservableList([]);
    var key2 = volume.addValue(source2);

    var target = volume.flatten();

    var key11 = source1.addValue(1);
    var key12 = source1.addValue(2);
    var key21 = source2.addValue(3);

    volume.remove(key1);
    source1.addValue(5);

    checkObservableList(test, target, [3]);
    
    test.done();
};
