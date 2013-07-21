define([], function() {
return function(rere) {

var Variable = rere.future("reactive/Variable");
var ReduceTree = rere.future("reactive/ReduceTree");

var self = {
    track: function() {
        var id = 0;
        var counter = new (Variable())(id);
        for (var i in arguments) {
            (function(item){
                item.onEvent(function(){
                    counter.set(id++);
                });
            })(arguments[i]);
        }
        return counter;
    },
    when: function(rv, condition, fn, alt) {

        if (typeof(fn) != "function") {
            fn = (function(obj) { return function() { return obj; }; })(fn);
        }
        if (typeof(condition) != "function") {
            condition = (function(obj) { return function(x) { return x===obj; }; })(condition);
        }

        var result = new (Variable())();
        rv.onEvent(function(e){
            if (e[0]==="set" && condition(e[1])) {
                result.set(fn(e[1]));
            } else {
                result.unset();
            }
        });
        return arguments.length===4 ? result.coalesce(alt) : result;
    },
    sticky: function(rv) {
        var raise = rv.raise;
        rv.raise = function(value) {
            if (!rv.value().isempty() && rv.value().value()==value) return;
            raise.apply(rv, [value]);
        };

        var unset = rv.unset;
        rv.unset = function() {
            if (!rv.value().isempty()) {
                unset.apply(rv, []);
            }
        }

        return rv;
    },
    event: function(rv) {
        var event = new (Variable())();
        rv.onEvent(Variable().handler({
            set: function(v) {
                event.set(v);
                event.unset();
            },
            unset: function(){}
        }))
        return event;
    },
    batch: function(rv) {
        var id = function(x){ return x; }

        var result = new (Variable())();
        var isBatching = false;
        var lastEvent = null;
        result.core = rv;
        result.batch = function(){
            isBatching = true;
            lastEvent = null;
        };
        result.rollback = function() {
            lastEvent = null;
            isBatching = false;
        };
        result.commit = function(){
            if (lastEvent!=null) {
                (Variable()).replay(result, lastEvent, id);
                lastEvent = null;
            }
            isBatching = false;
        };
        rv.onEvent(function(e){
            if (!isBatching) {
                (Variable()).replay(result, e, id);
            } else {
                lastEvent = e;
            }
        });
        return result;
    },
    log: function(rv, mark) {
        var result = new (Variable())();
        rv.onEvent(function(e){
            if (mark) {
                console.info(mark);
            } 
            console.info(e);
            
            (Variable()).replay(result, e, function(x){return x});
        });
        return result;
    },
    not: function(rv) {
        return rv.lift(function(value){ return !value; });
    },
    // named by Hoogle ("[m a] -> m [a]")
    sequence: function(rvs) {
        var result = new (Variable())();
        for (var i in rvs) {
            result.onDispose(rvs[i].onEvent(check))
        }
        return result;
        function check() {
            var args = []
            for (var i in rvs) {
                if (rvs[i].value().isempty()) {
                    result.unset();
                    return;
                }
                args.push(rvs[i].value().value());
            }
            result.set(args);
        }
    },
    sequenceMap: function(rvs, f) {
        var collected = self.sequence(rvs);
        var result = collected.lift(function(e){
            return f.apply(null, e);
        });
        result.onDispose(function() { collected.dispose(); });
        return result;
    },
    merge: function(rvs) {
        var ts = 1;
        var tree = new (ReduceTree())(function(a,b) {
            return a.ts>b.ts ? a : b;
        });
        var result = self.when(
            tree.head, 
            function(v) { return v.ts!=0; },
            function(v) { return v.value; }
        );
        var sources = rvs.map(function(item){ 
            var input = item.clone();
            var source = input.lift(function(value){
                return {ts:ts++, value:value };
            }).coalesce({ts:0, value:null });
            tree.add("" + ts, source);
            return input;
        });
        result.onDispose(function(){
            sources.map(function(item) { item.dispose(); });
        });
        return result;
    },

    // TOREVIEW
    or: function() {
        return logical(arguments, function(a,b){return a||b}, false);
    },
    and: function() {
        return logical(arguments, function(a,b){return a&&b}, true);
    }
};
self.unwrapObject = function(obj) {
    var ObservableList = rere.reactive.ObservableList;
    var Variable = rere.reactive.Variable;

    if (typeof obj != "object") {
        return new Variable(obj)
    }
    if (obj["rere/reactive/rv.unwrapObject.wait"]) {
        return self.unwrapObject.wait(self.unwrapObject(obj.value));
    }
    if (obj["rere/reactive/rv.unwrapObject.ignore"]) {
        return new Variable(obj);
    }
    if (obj["rere/reactive/Channel"]) {
        return obj.bind(function(value){
            return self.unwrapObject(value);
        })
    }
    if (obj["rere/reactive/ObservableList"]) {
        return obj.list.bind(function(list){
            if (list.length==0) return new Variable([]);
            return obj.lift(function(value){
                value = self.unwrapObject(value);
                if (value["rere/reactive/rv.unwrapObject.wait"]) {
                    return value.value.lift(function(value) { return [value]; });
                } else {
                    return value.lift(function(value) {
                        return [value];
                    }).coalesce([]);
                }
            }).reduceCA(function(a,b){ return a.concat(b); });
        });
    }
    var disassembled = [];
    for (var key in obj) {
        (function(key){
            disassembled.push(self.unwrapObject(obj[key]).lift(function(value){
                return self.unwrapObject.ignore({key: key, value: value});
            }));
        })(key);
    }
    if (disassembled.length==0) {
        return new Variable({});
    }
    return self.unwrapObject(new ObservableList(disassembled)).lift(function(items){
        var obj = {};
        for (var i in items) {
            var kv = items[i];
            if (kv["rere/reactive/rv.unwrapObject.ignore"]) kv = kv.value;
            obj[kv.key] = kv.value;
        }
        return obj;
    });
}
self.unwrapObject.wait = function(value) {
    return {
        "rere/reactive/rv.unwrapObject.wait": true,
        value: value,
        lift: function(f) {
            return self.unwrapObject.wait(this.value.lift(f));
        }
    };
};
self.unwrapObject.ignore = function(value) {
    return {
        "rere/reactive/rv.unwrapObject.ignore": true,
        value: value
    };
};
return self;

function logical(args, op, seed) {
    var result = new (Variable())();
    for (var i in args) args[i].subscribe(check);
    return result;
    function check() {
        var r = seed;
        for (var i in args) {
            if (args[i].value().isempty()) {
                result.unset();
                return;
            };
            r = op(r, args[i].value().value());
        }
        result.set(r);
    }
}

};
});