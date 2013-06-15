var rere = require('../rerejs/rere.common');

var ReduceTree = rere.reactive.ReduceTree;
var Variable = rere.reactive.Variable;

exports.simple = function(test){
    test.expect(2);

    var tree = new ReduceTree(function(a,b) { return a+b; });

    var a = new Variable(1);
    var b = new Variable(2);

    tree.add("a", a);
    tree.add("b", b);

    var expect = [3, 5];
    var i=0;

    tree.head.subscribe(function(v){
        test.equal(v, expect[i++]);
    });

    b.set(4)

    test.done();
};

exports.unset = function(test){
    test.expect(1);

    var tree = new ReduceTree(function(a,b) { return a+b; });

    var a = new Variable(1);
    var b = new Variable(2);

    tree.add("a", a);
    tree.add("b", b);
    b.unset();

    test.ok(tree.head.value().isempty());

    test.done();
};

exports.unsetRemove = function(test){
    test.expect(2);

    var tree = new ReduceTree(function(a,b) { return a+b; });

    var a = new Variable(1);
    var b = new Variable(2);

    tree.add("a", a);
    tree.add("b", b);
    b.unset();
    test.ok(tree.head.value().isempty());

    tree.remove("b");
    test.equal(tree.head.value().value(), 1);

    test.done();
};
