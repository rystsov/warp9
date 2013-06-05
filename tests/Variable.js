var rere = require('../rerejs/rere.common');

var Variable = rere.reactive.Variable;

exports.subscribeToInited = function(test){
    test.expect(1);
    var got = null;
    var rv = new Variable(42);
    rv.subscribe(function(value){
        got = value;
    });
    test.equal(got, 42);
    test.done();
};
