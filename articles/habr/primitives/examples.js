var warp9 = require('../../../warp9/warp9.common.js');

var Cell = warp9.reactive.Cell;
var List = warp9.reactive.List;

exports.slide04 = function(test) {

    var a = new Cell();

    test.done();
};

exports.slide05 = function(test) {

    var a = new Cell();
    a.set(42);

    test.done();
};

exports.slide06 = function(test) {

    var a = new Cell(42);

    test.done();
};

exports.slide07 = function(test) {

    var a = new Cell(42);
    a.unset();

    test.done();
};

exports.slide08 = function(test) {
    test.expect(1);

    var a = new Cell(42);
    test.equal(a.unwrap(), 42);

    test.done();
};

exports.slide09 = function(test) {
    test.expect(1);

    var a = new Cell();
    test.equal(a.unwrap(42), 42);

    test.done();
};

exports.slide10 = function(test) {
    var a = new Cell();
    var b = a.lift(function(a) {
        return a+2;
    }); isUnset(b);
    a.set(1); has(a, 1); has(b, 3);
    a.set(5); has(a, 5); has(b, 7);
    a.unset(); isUnset(b); isUnset(a);

    test.done();
};

exports.slide14 = function(test) {
    var a = new Cell();
    var b = a.coalesce(42); has(b, 42);
    a.set(13); has(a, 13); has(b, 13);
    a.unset(); isUnset(a); has(b, 42);

    test.done();
};

exports.slide15 = function(test) {
    var a = new Cell();
    var b = a.isSet(); has(b, false);
    a.set(13); has(a, 13); has(b, true);
    a.unset(); isUnset(a); has(b, false);

    test.done();
};

exports.slide17 = function(test) {
    var a = new Cell();
    var b = a.when(function(a) {
        return a>3 ;
    }); isUnset(b);
    a.set(42); has(a, 42); has(b, 42);
    a.set(4); has(a, 4); has(b, 4);
    a.set(1); has(a, 1); isUnset(b);

    test.done();
};

exports.slide20 = function(test) {
    var a = new Cell();
    var b = a.when(
        function(a) { return a>3; },
        function(x){ return x+1 }
    ); isUnset(b);
    a.set(42); has(a, 42); has(b, 43);
    a.set(4); has(a, 4); has(b, 5);
    a.set(1); has(a, 1); isUnset(b);

    test.done();
};

exports.slide22 = function(test) {
    var a = new Cell();
    var b = a.when(42,13); isUnset(b);
    a.set(42); has(a, 42); has(b, 13);
    a.set(4); has(a, 4); isUnset(b);

    test.done();
};

exports.slide24 = function(test) {
    var a = new Cell();
    var b = a.when(
        function(a) { return a>=0; },
        function(x) { return x+1; },
        function(x) { return x-1; }
    ); isUnset(b);
    a.set(0); has(a, 0); has(b, 1);
    a.set(-1); has(a, -1); has(b, -2);
    a.unset(); isUnset(a); isUnset(b);

    test.done();
};

exports.slide25 = function(test) {
    var a = new Cell();
    var b = a.when(true, 1, 0); // b is unset
    a.set(true); has(a, true); has(b, 1);
    a.set(false); has(a, false); has(b, 0);
    a.unset(); isUnset(a); isUnset(b);

    test.done();
};

exports.slide30 = function(test) {
    var cell = new Cell();
    cell.lift = function(f) {
        return this.bind(function(x) {
            return new Cell(f(x));
        });
    };

    var b = cell.lift(function(x) { return x+2; });
    cell.set(2); has(cell, 2); has(b, 4);


    test.done();
};

exports.slide31 = function(test) {
    var cell = new Cell();
    cell.when = function(f) {
        return this.bind(function(x) {
            return f(x) ? new Cell(x) : new Cell();
        });
    };

    var b = cell.when(function(a) {
        return a>3 ;
    }); isUnset(b);
    cell.set(42); has(cell, 42); has(b, 42);
    cell.set(4); has(cell, 4); has(b, 4);
    cell.set(1); has(cell, 1); isUnset(b);

    test.done();
};

exports.slide33 = function(test) {
    var a = new Cell(1);
    var b = new Cell(2);
    var sum = a.bind(function(a) {
        return b.bind(function(b) {
            return new Cell(a+b);
        });
    }); has(sum, 3);
    a.set(2); has(a, 2); has(b, 2); has(sum, 4);
    b.unset(); has(a, 2); isUnset(b); isUnset(sum);


    test.done();
};

exports.slide36 = function(test) {
    var list = new List();

    test.done();
};

exports.slide37 = function(test) {
    var list = new List([1,2,3]);

    test.done();
};

exports.slide38 = function(test) {
    var list = new List();
    list.add("Warp9");
    list.add("React");

    test.done();
};

exports.slide39 = function(test) {
    var list = new List();
    list.add("Warp9");
    eq(list.unwrap(), ["Warp9"]);

    test.done();
};

exports.slide40 = function(test) {
    var list = new List();
    var warpId = list.add("Warp9");
    var reactId = list.add("React");
    eq(list.unwrap(), ["Warp9", "React"]);
    list.remove(reactId);
    eq(list.unwrap(), ["Warp9"]);

    test.done();
};

exports.slide41 = function(test) {
    var list = new List();
    list.add(function(id){
        return { id: id, name: "Warp"};
    });

    test.done();
};

exports.slide42 = function(test) {
    var list = new List([1,2,3]);
    list.removeWhich(function(x) {
        return x < 2;
    });
    eq(list.unwrap(), [2,3]);

    test.done();
};

exports.slide43 = function(test) {
    var list = new List([
        "Warp9", "React"
    ]);
    var items = [];
    list.forEach(function(x){
        items.push(x);
    });
    eq(items, ["Warp9", "React"]);

    test.done();
};

exports.slide45 = function(test) {
    var a = new List();
    var b = a.lift(function(x){ return x+2; });
    eq(b.unwrap(), []);
    var id1 = a.add(1);
    eq(a.unwrap(), [1]); eq(b.unwrap(), [3]);
    var id2 = a.add(2);
    eq(a.unwrap(), [1, 2]); eq(b.unwrap(), [3, 4]);
    a.remove(id1);
    eq(a.unwrap(), [2]); eq(b.unwrap(), [4]);

    test.done();
};

exports.slide48 = function(test) {
    var list = new List();
    var sum = list.reduce(0, function(a,b) {
        return a+b;
    });
    list.add(41); has(sum, 41);
    list.add(1); has(sum, 42);

    test.done();
};

exports.slide50 = function(test) {
    var list = new List();
    var count = list.lift(function(x) {
        return 1;
    }).reduce(0, function(a,b) {
            return a+b;
        });
    var id41 = list.add(41); has(count, 1);
    list.add(1); has(count, 2);
    list.remove(id41); has(count, 1);

    test.done();
};

exports.slide51 = function(test) {
    var list = new List();
    var count = list.reduce(0, function(a,b) {
        return a+b;
    }, {
        wrap: function(x) {
            return 1;
        }
    });

    var id41 = list.add(41); has(count, 1);
    list.add(1); has(count, 2);
    list.remove(id41); has(count, 1);

    test.done();
};

exports.slide55 = function(test) {
    var list = new List();
    var sum = list.reduceGroup({
        identity: function() { return 0 },
        add: function(a,b) { return a+b; },
        invert: function(x) { return -x; }
    });

    list.add(41); has(sum, 41);
    list.add(1); has(sum, 42);

    test.done();
};

exports.slide61 = function(test) {
    var list = new List();
    var and = list.reduceGroup({
        identity: function() { return [0,0]; },
        add: function(x,y) {
            return [x[0]+y[0],x[1]+y[1]];
        },
        invert: function(x) {
            return [-x[0],-x[1]];
        }
    },{
        wrap: function(x) {
            return x ? [1,1] : [0,1];
        },
        unwrap: function(x) {
            return x[0]==x[1];
        }
    });

    list.add(true); has(and, true);
    var id2 = list.add(false); has(and, false);
    list.remove(id2); has(and, true);
    list.add(true); has(and, true);

    test.done();
};

exports.slide63 = function(test) {
    var list = new List();
    var it1 = new Cell(0);
    var it2 = new Cell(1);
    var sum = list.reduce(0, function(a,b) {
        return a + b;
    }); has(sum, 0);
    var itId1 = list.add(it1); has(sum, 0);
    var itId2 = list.add(it2); has(sum, 1);
    it1.set(5); has(sum, 6);
    it2.set(2); has(sum, 7);
    it1.unset(); isUnset(sum);
    list.remove(itId1); has(sum, 2);

    test.done();
};

exports.slide64 = function(test) {
    var item1 = new Cell();
    var item2 = new Cell(1);
    var list = new List([item1, item2]);
    var sum = list.reduce(0, function(a,b) {
        return a + b;
    }, {
        ignoreUnset: true
    }); has(sum, 1);
    item1.set(3); has(sum, 4);

    test.done();
};



function has(cell, x) {
    if (cell.unwrap({})!==x) throw new Error();
}

function isUnset(cell) {
    var marker = {};
    if (cell.unwrap(marker)!==marker) throw new Error();
}

function eq(a, b) {
    if (a.length != b.length) throw new Error();
    for (var i=0;i< a.length;i++) {
        if (a[i]!=b[i]) throw new Error();
    }
}