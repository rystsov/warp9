module.exports = Summer;

function Summer() {}

Summer.prototype.identity = function() {
    return 0;
};

Summer.prototype.add = function(a,b) {
    return a+b;
};

Summer.prototype.invert = function(x) {
    return -x;
};
