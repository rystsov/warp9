define(
    ["rere/reactive/Variable", "rere/adt/adt"], 
    function(Variable, adt) {
        function logical(args, op, seed) {
            var result = new Variable();
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
        return {
            log: function(rv, mark) {
                var result = new Variable();
                rv.onEvent(function(e){
                    if (mark) {
                        console.info(mark);
                    } 
                    console.info(e);
                    
                    Variable.replay(result, e, function(x){return x});
                });
                return result;
            },
            batch: function(rv) {
                var id = function(x){ return x; }

                var result = new Variable();
                var isBatching = false;
                var lastEvent = null;
                result.batch = function(){
                    isBatching = true;
                    lastEvent = null;
                };
                result.commit = function(){
                    if (lastEvent!=null) {
                        Variable.replay(result, lastEvent, id);
                        lastEvent = null;
                    }
                    isBatching = false;
                };
                rv.onEvent(function(e){
                    if (!isBatching) {
                        Variable.replay(result, e, id);
                    } else {
                        lastEvent = e;
                    }
                });
                return result;
            },
            binary: function(rvs, f) {
                var result = new Variable();
                var handlers = [];
                for (var i in rvs) {
                    handlers.push(rvs[i].onEvent(check));
                }
                result.dispose = function() {
                    for (var i in handlers) {
                        handlers[i]();
                    }
                }
                return result;
                function check() {
                    var args = []
                    for (var i in rvs) {
                        if (rvs[i].value().isempty()) {
                            return;
                        }
                        args.push(rvs[i].value().value());
                    }
                    result.set(f.apply(null, args));
                }
            },
            or: function() {
                return logical(arguments, function(a,b){return a||b}, false);
            },
            and: function() {
                return logical(arguments, function(a,b){return a&&b}, true);
            },
            not: function(rv) {
                return rv.lift(function(value){ return !value; });
            },
            when: function(rv, condition, fn) {
                if (typeof(fn) != "function") {
                    var obj = fn;
                    fn = function() { return obj; }
                }
                return rv.lift(function(data){
                    if (typeof(condition) == "function") {
                        if (condition(data)) {
                            return new adt.maybe.Some(fn(data));
                        } else {
                            return new adt.maybe.None();
                        }
                    } else {
                        return condition===data ? new adt.maybe.Some(fn(data)) : new adt.maybe.None();
                    }
                })
            },
            rv: {
                unwrap: function(rv) {
                    var watermark = 0;
                    var result = new Variable();
                    
                    rv.onEvent(function(e){
                        watermark++;
                        if (e[0]==="set") {
                            var mark = watermark;
                            e[1].onEvent(function(e){
                                if (mark!=watermark) return;
                                if (e[0]==="set") {
                                    result.set(e[1]);
                                } else if (e[0]==="unset") {
                                    result.unset()
                                } else {
                                    throw new Error();
                                }
                            });
                        } else if (e[0]==="unset") {
                            result.unset()
                        } else {
                            throw new Error();
                        }
                    });

                    return result;
                }
            },
            maybe: {
                unwrap: function(rv, none) {
                    if (typeof(none) != "function") {
                        var obj = none;
                        none = function() { return obj; }
                    }
                    var result = new Variable();
                    rv.subscribe(function(val){
                        if (!val["_m_is_maybe"]) throw new Error();
                        
                        if (val.isempty()) {
                            result.set(none());
                        } else {
                            result.set(val.value());
                        }
                    });
                    return result;
                },
                lift: function(rv, fn) {
                    var result = new Variable();
                    rv.subscribe(function(val){
                        if (!val["_m_is_maybe"]) throw new Error();
                        
                        if (val.isempty()) {
                            result.set(new adt.maybe.None());
                        } else {
                            result.set(new adt.maybe.Some(fn(val.value())));
                        }
                    });
                    return result;
                },
                when: function() {
                    if (arguments.length<3) {
                        throw new Error();
                    }
                    var rv = arguments[0];
                    var obj = arguments[1];
                    var fn = arguments[2];
                    var none = arguments.length==3 ? new adt.maybe.None() : arguments[3];

                    var result = new Variable(none);
                    rv.subscribe(function(val){
                        if (!val["_m_is_maybe"]) throw new Error();
                        
                        if (val.isempty()) {
                            result.set(none);
                        } else {
                            if (val.hasvalue(obj)) {
                                result.set(new adt.maybe.Some(fn(val.value())));
                            } else {
                                result.set(none);
                            }
                        }
                    });
                    return result;
                }
            }
        }
    }
);