define([], function() {
return function(rere) {

var Variable = rere.future("reactive/Variable");
var ReduceTree = rere.future("reactive/ReduceTree");

var self = {
    when: function(rv, condition, fn) {
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
        })
        return result;
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