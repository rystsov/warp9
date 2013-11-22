var warp9 = require('../target/warp9.common');

var DAG = warp9.core.dag.DAG;

exports.transfer = function(test) {
    test.expect(4);
    test.equal(DAG.length, 0);

    var a = new warp9.Cell(0);
    var b = new warp9.Cell(0);

    var invariant = warp9.do(function(){
        return a.get() + b.get();
    });
    var dispose = invariant.onChange(function(invariant){
        test.equal(invariant.get(), 0);
    });

    warp9.tx(function(){
        a.set(10);
        b.set(-10);
    })();

    test.equal(a.get(), 10);
    test.equal(b.get(), -10);

    dispose();

    test.done();
};
