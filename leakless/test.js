var Variable = require('./Variable').ctor;
var GC = require('./GC');


var a = new Variable().name("a");
var b = new Variable().name("b");

var c = a.bind(function(a) {
    return b.bind(function(b) {
        return new Variable(a + 2 * b).name("b-bind");
    }).name("a-bind");
}).name("c");

/*c.onEvent([], Variable.handler({
    set: function(e) {
        console.info("set " + e);
    },
    unset: function() {
        console.info("unset");
    }
}));*/

a.set(2);
b.set(1);


console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);

a.set(3);
a.set(4);
a.set(5);
a.set(6);
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
