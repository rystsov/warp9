var rere = require('../rere.common');

var Summer = require('./utils/Summer');
var ReduceTests = require('./utils/List.ReduceTests');


var tests = new ReduceTests(function(list, opt){
    if (opt) {
        return list.reduceMonoid(new Summer(), opt);
    }
    return list.reduceMonoid(new Summer());
});

module.exports = {
    subscribeUnused: tests.subscribeUnused
};