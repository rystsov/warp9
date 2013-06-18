var rere = require('../rerejs/rere.common');

var Variable = rere.reactive.Variable;
var rv = rere.reactive.rv;

exports.set = function(test){
    test.expect(7);

    var a = new Variable();
    var b = new Variable();

    var m = rv.merge([a, b]);

    var expect = [6, 5, 1, 1, 5];
    var i = 0;

    m.subscribe(function(m){
        test.equal(m, expect[i++]);
    });

    a.set(6);
    a.set(5);
    b.set(1);
    b.set(1);
    b.unset();
    a.unset();
    

    m.dispose();
    test.equal(a["rere/reactive/Channel/dependants"].length, 0);
    test.equal(b["rere/reactive/Channel/dependants"].length, 0);

    test.done();
};
