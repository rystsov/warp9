var rere = require('../rere.common');

var ReduceTree = rere.reactive.algebra.ReduceTree;

exports.doubleDelete = function(test){
    test.expect(3);

    var tree = new ReduceTree({
        identity: function() { return 0; },
        add: function(a,b) { return a+b; }
    }, function(x) {
        return x;
    }, function(x) {
        return x;
    }, false);

    test.equal(tree.value.unwrap(), 0);

    var un2 = tree.add(2);
    var un3 = tree.add(3);

    test.equal(tree.value.unwrap(), 5);

    un2();
    un3();

    test.equal(tree.value.unwrap(), 0);

    test.done();
};

exports.addDeleteAdd = function(test){
    test.expect(4);

    var tree = new ReduceTree({
        identity: function() { return 0; },
        add: function(a,b) { return a+b; }
    }, function(x) {
        return x;
    }, function(x) {
        return x;
    }, false);

    test.equal(tree.value.unwrap(), 0);
    var un2 = tree.add(2);
    test.equal(tree.value.unwrap(), 2);
    un2();
    test.equal(tree.value.unwrap(), 0);
    var un3 = tree.add(3);
    test.equal(tree.value.unwrap(), 3);

    test.done();
};