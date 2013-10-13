var rere = require('../rere.common');

var Summer = require('./utils/Summer');
var ReduceTests = require('./utils/List.ReduceTests');


module.exports = new ReduceTests(function(list, opt){
    if (opt) {
        return list.reduceGroup(new Summer(), opt);
    }
    return list.reduceGroup(new Summer());
});
