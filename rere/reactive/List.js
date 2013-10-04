expose(List);

var listId = 0;

function List(data) {
    var self = this;
    var elementId = 0;

    this.type = List;

    this.handlers   = [];
    this.handlersId = 0;
    this.data = [];
    this.id = listId++;
    var count = new root.reactive.Cell(0);


    this.initReducer = function(reducer) {
        var subscribes = {};
        this.subscribe(List.handler({
            data: function(e) {
                for (var i=0;i < e.length;i++) {
                    subscribes[e[i].key] = reducer.add(e[i].value);
                }
            },
            add: function(e) {
                subscribes[e.key] = reducer.add(e.value);
            },
            remove: function(e) {
                if (e in subscribes) {
                    subscribes[e]();
                    delete subscribes[e];
                }
            }
        }));
    };

    this.reduceGroup = function(group, opt) {
        if (!opt) opt = {};
        if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
        if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };

        var counter = new root.reactive.algebra.Sigma(group, opt.wrap, opt.unwrap);
        this.initReducer(counter);
        return counter.value;
    };

    this.reduceMonoid = function(monoid, opt) {
        if (!opt) opt = {};
        if (!opt.hasOwnProperty("wrap")) opt.wrap = function(x) { return x; };
        if (!opt.hasOwnProperty("unwrap")) opt.unwrap = function(x) { return x; };
        if (!opt.hasOwnProperty("ignoreUnset")) opt.ignoreUnset = false;

        var counter = new root.reactive.algebra.ReduceTree(monoid, opt.wrap, opt.unwrap, opt.ignoreUnset);
        this.initReducer(counter);
        return counter.value;
    };

    this.reduce = function(identity, add, opt) {
        return this.reduceMonoid({
            identity: function() {return identity; },
            add: add
        }, opt);
    };

    this.count = function() {
        if (arguments.length===0) return count;

        var predicate = arguments[0];

        return this.lift(function(x){
            x = predicate(x);
            if (typeof x === "object" && x.type === Cell) {
                return x.lift(function(x) { return bool_to(x, 1, 0); });
            }
            return bool_to(x, 1, 0);
        }).reduceGroup({
            identity: function() { return 0; },
            add: function(x,y) { return x+y; },
            invert: function(x) { return -x; }
        });
    };

    this.all = function(predicate) {
        return this.lift(predicate).reduceGroup({
            identity: function() { return [0,0]; },
            add: function(x,y) { return [x[0]+y[0],x[1]+y[1]]; },
            invert: function(x) { return [-x[0],-x[1]]; }
        },{
            wrap: function(x) { return bool_to(x, [1,1], [0,1]); },
            unwrap: function(x) { return x[0]==x[1]; }
        });
    };

    this.forEach = function(callback) {
        for(var i=0;i<this.data.length;i++) {
            callback(this.data[i].value);
        }
    };

    function bool_to(x, t, f) {
        if (x === true) return t;
        if (x === false) return f;
        throw new Error();
    }

    this.setData = function(data) {
        var length = this.data.length;
        this.data = data.map(function(item){
            return {
                key: elementId++,
                value: item
            }
        });
        if (length!=this.data.length) {
            count.set(this.data.length);
        }
        for (var i=0; i<this.handlers.length; i++) {
            this.handlers[i].f([
                "data",
                this.data.slice()
            ]);
        }
    };

    this.remove = function(key) {
        var removed = false;
        var length = this.data.length;
        this.data = this.data.filter(function(item){
            return item.key != key;
        });
        if (length!=this.data.length) {
            count.set(this.data.length);
            removed = true;
        }
        for (var i=0;i<this.handlers.length;i++) {
            this.handlers[i].f(["remove", key]);
        }
        return removed;
    };

    this.removeWhich = function(f) {
        this.data.filter(function(item) {
            return f(item.value);
        }).forEach(function(item){
            this.remove(item.key);
        }.bind(this));
    };

    this.add = function(f) {
        if (typeof(f) != "function") throw new Error();
        var key = elementId++;
        var e = {key: key, value: f(key)};
        this.data.push(e);
        count.set(this.data.length);
        for (var i=0;i<this.handlers.length;i++) {
            this.handlers[i].f(["add", e]);
        }
    };

    this.addKeyValue = function(key, value) {
        var e = {key: key, value: value};
        this.data.push(e);
        count.set(this.data.length);
        for (var i=0;i<this.handlers.length;i++) {
            this.handlers[i].f(["add", e]);
        }
    };

    this.lift = function(f) {
        var nova = new List([]);
        this.subscribe(List.handler({
            data: function(e) { nova.setData(e.map(function(i){ return f(i.value); })); },
            add: function(e) { nova.addKeyValue(e.key, f(e.value)); },
            remove: function(e) { nova.remove(e); }
        }));
        return nova;
    };

    this.subscribe = function(f) {
        var id = this.handlersId++;
        this.handlers.push({key: id, f:f});
        f(["data", this.data.slice()]);
        return function() {
            self.handlers = self.handlers.filter(function(handler) {
                return handler.key!=id;
            });
        }
    };

    this.setData(data);
}

List.handler = function(handlers) {
    return function(e) {
        while(true) {
            if (e[0]==="data") break;
            if (e[0]==="add") break;
            if (e[0]==="remove") break;
            throw new Error();
        }
        handlers[e[0]].call(handlers, e[1]);
    };
};