var rere = require('../rere.common');

var Cell = rere.reactive.Cell;
var List = rere.reactive.List;
var idgenerator = rere.idgenerator;


// TODO: uncomment
//exports.dag1 = function(test) {
//    test.expect(2);
//
//    var list = new List();
//
//    var hasItem = list.reduceGroup({
//        identity: function() { return 0; },
//        add: function(a,b) { return a+b; },
//        invert: function(x) { return -x; }
//    }, {
//        wrap: function() { return 1; },
//        unwrap: function(x) { return x > 0; }
//    });
//
//    var left    = list.reduceGroup({
//        identity: function() { return 0; },
//        add: function(a,b) { return a+b; },
//        invert: function(x) { return -x; }
//    }, {
//        wrap: function() { return 1; }
//    });
//
//    var dag = hasItem.bind(function(hasItem){
//        if (hasItem) return left;
//        return new Cell();
//    });
//    dag.fix();
//    var event = null;
//    dag.onEvent(Cell.handler({
//        set: function(x) { event = [x]; },
//        unset: function() { event = []; }
//    }));
//    test.equal(event.length, 0);
//
//    list.add("qwerty");
//    test.equal(event[0], 1);
//
//    test.done();
//};


exports.unary = function(test) {
    test.expect(4);
    var cell = new Cell();
    test.equal(cell.dependants.length, 0);
    var add3 = cell.bind(function(x){
        return new Cell(x+3);
    });
    var id = idgenerator();
    add3.use(id);
    var event = null;
    add3.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event.length, 0);
    cell.set(2);
    test.equal(event[0], 5);
    add3.leave(id);
    test.equal(cell.dependants.length, 0);
    test.done();
};

exports.binary = function(test) {
    test.expect(5);
    var a = new Cell(2);
    var b = new Cell(3);
    var c = a.bind(function(a){
        return b.bind(function(b){
            return new Cell(a+b);
        });
    });

    test.equal(a.dependants.length, 0);
    test.equal(b.dependants.length, 0);

    var id = idgenerator();
    c.use(id);
    var event = null;
    c.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(event[0], 5);

    c.leave(id);
    test.equal(a.dependants.length, 0);
    test.equal(b.dependants.length, 0);
    test.done();
};

exports.binaryIntensive = function(test) {
    var A_CHANGES = 5;
    var B_CHANGES = 10;
    var id = idgenerator();

    test.expect(8 + A_CHANGES*B_CHANGES);
    var a = new Cell(0);
    var b = new Cell(0);
    var c = a.bind(function(a){
        return b.bind(function(b){
            return new Cell(a+b);
        });
    });
    var event = null;
    c.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(a.usersCount, 0);
    test.equal(b.usersCount, 0);
    test.equal(event, null);

    c.use(id);
    test.equal(a.usersCount, 1);
    test.equal(b.usersCount, 1);
    test.equal(event[0], 0);

    for(var i=0;i<A_CHANGES;i++) {
        a.set(i);
        for(var j=0;j<B_CHANGES;j++) {
            b.set(j);
            test.equal(event[0], i+j);
        }
    }

    c.leave(id);
    test.equal(a.dependants.length, 0);
    test.equal(b.dependants.length, 0);
    test.done();
};

exports.binaryLeakless = function(test) {
    var A_CHANGES = 5;
    var B_CHANGES = 10;
    var id = idgenerator();

    var cells = [];

    test.expect(8 + 2*A_CHANGES*B_CHANGES);
    var a = new Cell(0);
    var b = new Cell(0);
    var c = a.bind(function(a){
        return b.bind(function(b){
            var cell = new Cell(a+b);
            cells.push(cell);
            return cell;
        });
    });
    var event = null;
    c.onEvent(Cell.handler({
        set: function(value) { event = [value]; },
        unset: function() { event = []; }
    }));
    test.equal(a.usersCount, 0);
    test.equal(b.usersCount, 0);
    test.equal(event, null);

    c.use(id);
    test.equal(a.usersCount, 1);
    test.equal(b.usersCount, 1);
    test.equal(event[0], 0);

    for(var i=0;i<A_CHANGES;i++) {
        a.set(i);
        for(var j=0;j<B_CHANGES;j++) {
            b.set(j);
            test.equal(event[0], i+j);
            test.equal(cells.filter(function(cell){
                return cell.dependants.length>0;
            }).length, 1);
        }
    }

    c.leave(id);
    test.equal(a.dependants.length, 0);
    test.equal(b.dependants.length, 0);
    test.done();
};

exports.unwrapIntensive = function(test) {
    var A_CHANGES = 5;
    var B_CHANGES = 10;

    test.expect(8 + A_CHANGES*B_CHANGES);
    var a = new Cell(0);
    var b = new Cell(0);
    var c = a.bind(function(a){
        return b.bind(function(b){
            return new Cell(a+b);
        });
    });
    test.equal(a.usersCount, 0);
    test.equal(b.usersCount, 0);
    test.equal(a.dependants.length, 0);
    test.equal(b.dependants.length, 0);

    for(var i=0;i<A_CHANGES;i++) {
        a.set(i);
        for(var j=0;j<B_CHANGES;j++) {
            b.set(j);
            test.equal(c.unwrap(), i+j);
        }
    }

    test.equal(a.usersCount, 0);
    test.equal(b.usersCount, 0);
    test.equal(a.dependants.length, 0);
    test.equal(b.dependants.length, 0);
    test.done();
};