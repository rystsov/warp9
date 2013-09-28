expose(Group);

function Group() {
    this.identity = function() {
        throw new Error();
    };
    this.add = function(a,b) {
        throw new Error();
    };
    this.invert = function(x) {
        return x;
    };
}
