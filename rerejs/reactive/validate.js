define(
    ["rere/reactive/Variable", "rere/adt/adt"], 
    function(Variable, adt) {
        return {
            rv: {
                //validate.rv.maybe<T> : (RV<Maybe<T>>, T->bool|RV<bool>, bool|RV<bool>) -> RV<bool>
                maybe: function(rv, f, none) {
                    var result = new Variable();
                    none = asRv(none);
                    
                    var useNone = false;
                    var lastNone = new adt.maybe.None();
                    var waterMark = 0;

                    none.subscribe(function(value){
                        lastNone = new adt.maybe.Some(value);
                        if (useNone) {
                            result.set(lastNone.value());
                        }
                    });

                    rv.subscribe(function(value){
                        waterMark++;
                        if (value.isempty()) {
                            useNone = true;
                            if (!lastNone.isempty()) {
                                result.set(lastNone.value());
                            }
                        } else {
                            useNone = false;
                            result.unset();
                            value = asRv(f(value.value()));
                            (function(myMark){
                                value.subscribe(function(value){
                                    if (myMark!=waterMark) return;
                                    result.set(value);
                                });
                            })(waterMark);
                        }
                    });
                    return result;

                    function asRv(val) {
                        if (typeof(val)=="boolean") {
                            return new Variable(val);
                        }
                        return val;
                    }
                }
            }
        }
    }
);