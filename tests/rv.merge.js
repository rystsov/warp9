var rere = require('../rerejs/rere.common');

var Variable = rere.reactive.Variable;
var rv = rere.reactive.rv;

exports.set = function(test){
    var a = new Variable();
    var b = new Variable();

    var m = rv.merge([a, b]);

    m.dispose();
    test.equal(a["rere/reactive/Channel/dependants"].length, 0);
    test.equal(b["rere/reactive/Channel/dependants"].length, 0);

    test.done();
};
