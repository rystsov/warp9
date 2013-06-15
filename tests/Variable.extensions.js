var rere = require('../rerejs/rere.common');

var Variable = rere.reactive.Variable;

exports.coalesce = function(test){
    test.expect(3);
    
    var source = new Variable(42);
    var target = source.coalesce(13);

    var expect = [42, 13, 12];
    var i = 0;

    target.subscribe(function(value){
        test.equal(value, expect[i++]);
    });

    source.unset();
    source.set(12);

    test.done();
};
