var Variable = require('./Variable').ctor;
var GC = require('./GC');


var a = new Variable(2).name("a");
var b = new Variable(1).name("b");

var c = a.bind(function(a) {
    return b.bind(function(b) {
        return new Variable(a + 2 * b).name("b-bind");
    }).name("a-bind");
}).name("c");
c.isUsed = true;

console.info("# C CREATED");
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
console.info("###### objects ########");
console.info(GC.count(a,b));
console.info("");


a.set(3);
a.set(4);
a.set(5);
a.set(6);
b.set(7);
console.info("# A/B ALTERS");
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
console.info("###### objects ########");
console.info(GC.count(a,b));
console.info("");


GC.collect(a, b);
console.info("# GARBAGE IS COLLECTED");
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
console.info("###### objects ########");
console.info(GC.count(a,b));
console.info("");


c.isUsed = false;
GC.collect(a, b);
console.info("# C IS MARKED UNUSED");
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
console.info("");

c.activate();
console.info("# C IS ACTIVATED");
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
