var warp9 = require('../target/warp9.common');

var Summer = require('./utils/Summer');
var ReduceTests = require('./utils/TngList.ReduceTests');


module.exports = new ReduceTests(function(list, opt){
    if (opt) {
        return list.reduceGroup(new Summer(), opt);
    }
    return list.reduceGroup(new Summer());
});
