var rere = require('../rerejs/rere.common');

var Variable = rere.reactive.Variable;

exports.casual = function(test){
    test.expect(3);
    
    var c = new Variable(2);
    var f = function(a) { return c.lift(function(v){ return v + a; }) }

    var source = new Variable();
    var target = source.bind(f);

    var expect = [3, 6, 5];
    var i = 0;

    target.subscribe(function (v) {
    	test.ok(v==expect[i++]);
    });

    source.set(1);
    source.set(4);
    c.set(1);
    
    test.done();
};

exports.changeOld = function(test){
    test.expect(4);
    
    var items = [new Variable(1), new Variable(2)]

    var f = function(i) { return items[i]; }

    var source = new Variable(0);
    var target = source.bind(f);

    var expect = [1, 3, 2, 5];
    var i = 0;

    target.subscribe(function (v) {
    	test.ok(v==expect[i++]);
    });

    items[0].set(3);
    source.set(1);
    items[0].set(4);
    items[1].set(5);

    test.done();
};
