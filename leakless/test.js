var Variable = require('./Variable').ctor;
var GC = require('./GC');


var x = new Variable(5).name("x");
var y = x.lift(function(x) { return 2*x; }).name("y");

/*x.isUsed = true;
y.isUsed = true;
GC.collect(x);
GC.printFullDependencies(x);
y.isUsed = false;
GC.collect(x);
GC.printFullDependencies(x);
y.activate();
GC.printFullDependencies(x);*/




var a = new Variable().name("a");
var b = new Variable().name("b");

var c = a.bind(function(a) {
    return b.bind(function(b) {
        return new Variable(a + 2 * b).name("b-bind");
    }).name("a-bind");
}).name("c");
c.isUsed = true;

a.set(2);
b.set(1);

console.info("# C CREATED");
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
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
console.info("");

GC.collect(a, b);
console.info("# GARBAGE IS COLLECTED");
console.info("###### a ########");
GC.printFullDependencies(a);
console.info("###### b ########");
GC.printFullDependencies(b);
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
