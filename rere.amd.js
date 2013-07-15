define('rere/adt/maybe',[], function() {
return function(rere) {

return {
    "Some": (function some(value) {
        this._m_is_maybe = true;
        this.value = function() {
            return value;
        };
        this.isempty = function() {
            return false;
        };
        this.lift = function(f) {
            return new some(f(value));
        };
    }),
    "None": function() {
        this._m_is_maybe = true;
        this.value = function() {
            throw new Error();
        };
        this.isempty = function() {
            return true;
        };
        this.lift = function() {
            return this;
        };
    }
};

};
});

define('rere/adt/error',[], function() {
return function(rere) {

return {
    "Value" : function(v) {
        this.isValue = true;
        this.value = v;
    },
    "Error" : function(message) {
        this.isError = true;
        this.message = message;
    },
    "concat" : function() {
        return (function(ms) {
            return function(v) {
                var v = m.error.value(v)
                for(var i=0;i<ms.length;i++) {
                    v = ms[i](v.value)
                    if (v.isError) return v
                    if (v.isValue) continue
                    throw new Error()
                }
                return v
            }
        })(arguments)
    }
};

};
});

define('rere/adt/defaultdict',[], function() {
return function(rere) {

return function(init) {
    this.init = init;
    this.data = {};
    this.set = function(key, value) {
        this.data[key] = value;
    };
    this.get = function(key) {
        if (!(key in this.data)) {
            this.data[key] = this.init();
        }
        return this.data[key];
    };
    this.remove = function(key) {
        delete this.data[key];
    };
};

};
});

define('rere/adt/adt',
["rere/adt/maybe", "rere/adt/error", "rere/adt/defaultdict"], 
function(maybe, error, Defaultdict) {
return function(rere) {

return {
    maybe : maybe(rere),
    error : error(rere),
    Defaultdict: Defaultdict(rere),
    dict : function(items){
    	var dict = {};
    	for (var i=0;i<items.length;i+=2) {
    		dict[items[i]] = items[i+1];
    	}
    	return dict;
    }
};

};
});

define('rere/reactive/Variable.Core',[], function() {
return function(rere) {

var maybe = rere.adt.maybe;

function variable() {
    this["rere/reactive/Channel"] = true;
    this["rere/reactive/Variable"] = true;
    this["rere/reactive/Channel/dependants"] = [];
    this["rere/reactive/Channel/dependants/id"] = 0;
    this["rere/reactive/Variable/value"] = new maybe.None();
    this["rere/reactive/Channel/on/dispose"] = [];

    this.T = variable;
    this.subscribe = function(f) {
        return this.onEvent(function(e){
            if (e[0]==="set") {
                f(e[1]);
            }
        });
    };
    this.onDispose = function(f) {
        this["rere/reactive/Channel/on/dispose"].push(f);
    };
    this.dispose = function() {
        this["rere/reactive/Channel/on/dispose"].map(function(f){
            f();
        });
    }
    this.onEvent = function(f) {
        var self = this;
        var id = this["rere/reactive/Channel/dependants/id"];
        this["rere/reactive/Channel/dependants/id"]++;
        this["rere/reactive/Channel/dependants"].push({key: id, f:f});
        if (this["rere/reactive/Variable/value"].isempty()) {
            f(["unset"]);
        } else {
            f(["set", this["rere/reactive/Variable/value"].value()]);
        }
        return function() {
            self["rere/reactive/Channel/dependants"] = self["rere/reactive/Channel/dependants"].filter(function(dependant) {
                return dependant.key!=id;
            });
        };
    };
    this.value = function() {
        return this["rere/reactive/Variable/value"]
    };
    this.raise = function(value) {
        this["rere/reactive/Variable/value"] = new maybe.Some(value)
        variable.raise(this, ["set", value])
    };
    this.follows = function() {
        var self = this;
        var what = arguments[0];
        var how = arguments.length>1 ? arguments[1] : function(x) { return x; };
        var dispose = what.onEvent(function(e){
            variable.replay(self, e, how);
        });
        self.onDispose(dispose);
        return dispose;
    }
    this.set = function(value) {
        this.raise(value);
    };
    this.unset = function() {
        this["rere/reactive/Variable/value"] = new maybe.None();
        variable.raise(this, ["unset"])
    };

    if (arguments.length>0) {
        this.raise(arguments[0])
    }
}

variable.prototype.clone = function(f) {
    var result = new variable();
    result.follows(this);
    return result;
};

variable.prototype.unwrap = function(alt) {
    return this.value().isempty() ? alt : this.value().value();
};

variable.prototype.lift = function(f) {
    var channel = new this.T();
    channel.onDispose(this.onEvent(function(e){
        variable.replay(channel, e, f);
    }));
    return channel;
};

variable.prototype.bind = function(f) {
    var result = new variable();
    var dispose = function() {};
    result.onDispose(this.onEvent(variable.handler({
        set: function(e) {
            dispose();
            dispose = f(e).onEvent(variable.handler(result));
        },
        unset: function(){
            dispose();
            dispose = function() {};
            result.unset();
        }
    })));
    result.onDispose(dispose);
    return result;
};

// TOREVIEW

variable.zip = function() {
    var r = new variable();
    for (var i in arguments) {
        arguments[i].subscribe(function(e){
            r.set(e);
        });
    }
    return r;
}

variable.raise = function(self, e) {
    for (var i in self["rere/reactive/Channel/dependants"]) {
        var f = self["rere/reactive/Channel/dependants"][i].f;
        f(e);
    }
}

variable.replay = function (self, e, f) {
    if (e[0]==="set") {
        self.set(f(e[1]));
    } else if (e[0]==="unset") {
        self.unset()
    } else {
        throw new Error();
    }
}

variable.handler = function(handler) {
    return function(e) {
        if (e[0]==="set") {
            handler.set(e[1]);
        } else if (e[0]==="unset") {
            handler.unset();
        } else {
            throw new Error("Unknown event: " + e[0]);
        }
    };
};

return variable;

};
});

define('rere/reactive/Variable.Extensions',[], function() {
return function(rere) {

return {
    coalesce: function(filler) {
        var Variable = rere.reactive.Variable;

        var self = this;
        var result = new Variable();
        result.onDispose(self.onEvent(Variable.handler({
            set: function (e) { result.set(e); },
            unset: function () { result.set(filler); }
        })));
        return result;
    }
};

};
});
define('rere/reactive/Variable',
["rere/reactive/Variable.Core", "rere/reactive/Variable.Extensions"], 
function(VariableCore, extensions) {
return function(rere) {

var Variable = VariableCore(rere);

Variable.prototype.coalesce = extensions(rere).coalesce;
return Variable;

};
});

define('rere/reactive/ObservableList.Core',[], function() {
return function(rere) {

var ObservableList = function(data) {
    var Variable = rere.reactive.Variable;
    var ReduceTree = rere.reactive.ReduceTree;

    var self = this;
    this.id = 0;
    this["handlers"] = [];
    this["handlers/id"] = 0;
    this["rere/reactive/ObservableList"] = true;
    this.list = new Variable();

    this.getData = function() {
        return this.data;
    };
    this.values = function() {
        return this.data.map(function(e){return e.value;});
    };
    this.setData = function(data) {
        this.data = data.map(function(item){
            return {
                key: self.id++,
                value: item
            }
        });
        for (var i in this.handlers) {
            this.handlers[i].f([
                "data", 
                this.data.map(function(x){return x})
            ]);
        }
        this.list.set(this.data);
    };
    
    this.setData(data);
    this.remove = function(key) {
        var data = [];
        for (var i=0;i<this.data.length;i++){
            if (this.data[i].key==key) continue;
            data.push(this.data[i]);
        }
        this.data = data;
        for (var i in this.handlers) {
            this.handlers[i].f(["remove", key]);
        }
        this.list.set(this.data)
    };
    this.add = function(f) {
        if (typeof(f) != "function") throw new Error();
        var key = self.id++;
        var e = {key: key, value: f(key)};
        this.data.push(e);
        for (var i in this.handlers) {
            this.handlers[i].f(["add", e]);
        }
        this.list.set(this.data)
    };
    this.addValue = function(value) {
        var key = null;
        this.add(function(k){
            key = k;
            return value;
        });
        return key;
    };
    this.addKeyValue = function(key, value) {
        var e = {key: key, value: value};
        this.data.push(e);
        for (var i in this.handlers) {
            this.handlers[i].f(["add", e]);
        }
        this.list.set(this.data)
    };

    this.lift = function(f) {
        var nova = new ObservableList([]);
        this.subscribe(ObservableList.handler({
            data: function(e) { nova.setData(e.map(function(i){ return f(i.value); })); },
            add: function(e) { nova.addKeyValue(e.key, f(e.value)); },
            remove: function(e) { nova.remove(e); }
        }));
        return nova;
    };

    this.subscribe = function(f) {
        var id = this["handlers/id"];
        this["handlers/id"]++;
        this["handlers"].push({key: id, f:f});
        f([
            "data", 
            this.data.map(function(x){return x})
        ]);
        return function() {
            self["handlers"] = self["handlers"].filter(function(handler) {
                return handler.key!=id;
            });
        }
    };

    this.reduceCA = function(f) {
        var args = arguments;
        var head = new Variable();
        var result = head.bind(function(x) { return x; });
        var tree = null;
        this.subscribe(ObservableList.handler({
            data: function(e) {
                head.unset();
                tree = args.length==1 ? new ReduceTree(f) : new ReduceTree(f, args[1]);
                for (var i in e) {
                    tree.add(e[i].key, e[i].value);
                }
                head.set(tree.head);
            },
            add: function(e) { return tree.add(e.key, e.value); },
            remove: function(e) { tree.remove(e); }
        }));
        return result;
    };
};

ObservableList.handler = function(handlers) {
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

return ObservableList;

};
});

define('rere/reactive/ObservableList.collector',[], function() {
return function(rere) {

var ObservableList = rere.future("reactive/ObservableList");

return {
    add: function(f) {
        var list = new (ObservableList())([]);
        
        var add = {};
        add.value = function(e) {
            list.add(function(key){
                return e;
            })
        };
        add.rv = function(rv) {
            list.addRv(rv);
        };
        add.list = function(item) {
            list.addList(item);
        };
        add.rv.maybe = function(rv) {
            var lastKey = null;
            rv.onEvent(function(e){
                if (lastKey!=null) {
                    list.remove(lastKey);
                    lastKey = null;
                }
                if (e[0]==="set") {
                    if (!(e[1]._m_is_maybe)) throw new Error();
                    if (!e[1].isempty()) {
                        list.add(function(key){
                            lastKey = key;
                            return e[1].value();
                        });
                    }
                }
            });
        };

        f(add);
        return list;
    },
    addRv: function(item) {
        var list = this;
        var lastKey = null;
        var dispose = item.onEvent(function(e){
            if (lastKey!=null) {
                list.remove(lastKey);
                lastKey = null;
            }
            if (e[0]==="set") {
                list.add(function(key){
                    lastKey = key;
                    return e[1];
                });
            }
        });
        return function() {
            dispose();
            if (lastKey!=null) {
                list.remove(lastKey);
            }
        };
    },
    addList: function(item) {
        var list = this;
        var remap = {}
        item.subscribe(function(e){
            if (e[0]==="data") {
                for (var i in e[1]) {
                    list.add(function(key){
                        remap[e[1][i].key]=key;
                        return e[1][i].value;
                    });
                }
            } else if (e[0]==="add") {
                list.add(function(key){
                    remap[e[1].key]=key;
                    return e[1].value;
                });
            } else if (e[0]==="remove") {
                list.remove(remap[e[1]]);
                delete remap[e[1]];
            } else {
                throw new Error("Unknown event: " + e[0]);
            }
        });
    }
};

};
});
define('rere/reactive/ObservableList.tolist',[], function() {
return function(rere) {

//var rv = rere.future("reactive/rv");
var ObservableList = rere.future("reactive/ObservableList");

return {
    rv: {
        list: function(rv) {
            var list = new (ObservableList())([]);
            var keys = {};
            var dispose = function() {};
            rv.onEvent(function(e){
                dispose();
                for (var key in keys) {
                    list.remove(key);
                }
                keys = {};
                dispose = function() {};
                if (e[0]==="set") {
                    dispose = e[1].subscribe((ObservableList()).handler({
                        data: function(e) { 
                            for (var i in e) {
                                keys[e[i].key] = true;
                                list.addKeyValue(e[i].key, e[i].value);
                            }
                        },
                        add: function(e) { 
                            keys[e.key] = true;
                            list.addKeyValue(e.key, e.value);
                        },
                        remove: function(e) { 
                            delete keys[e];
                            list.remove(e);
                        }
                    }));
                }
            });
            return list;
        }
    }
};

};
});
define('rere/reactive/ObservableList.flatten',[], function() {
return function(rere) {

var ObservableList = rere.future("reactive/ObservableList");

return function() {
    var result = new (ObservableList())([]);
    var groups = {};
    this.subscribe((ObservableList()).handler({
        data: function(items) {
            for (var i in items) {
                this.add(items[i]);
            }
        },
        add: function(item) {
            groups[item.key] = new Object();
            var sublist = item.value, group = groups[item.key];
            group.remap = {};
            group.dispose = sublist.subscribe((ObservableList()).handler({
                data: function(items) {
                    for (var i in items) {
                        this.add(items[i]);
                    }
                },
                add: function(item) {
                    group.remap[item.key] = result.addValue(item.value);
                },
                remove: function(key) {
                    result.remove(group.remap[key]);
                    delete group.remap[key];
                },
            }));
        },
        remove: function(key) {
            groups[key].dispose();
            for (var old in groups[key].remap) {
                result.remove(groups[key].remap[old]);
            }
        }
    }));
    return result;
};

};
});
define('rere/reactive/ObservableList',
["rere/reactive/ObservableList.Core", "rere/reactive/ObservableList.collector", "rere/reactive/ObservableList.tolist", "rere/reactive/ObservableList.flatten"], 
function(ObservableListCore, collector, tolist, flatten) {
return function(rere) {

var ObservableList = ObservableListCore(rere);
var packrat = collector(rere);

ObservableList.collector = packrat.add;
ObservableList.prototype.addList = packrat.addList;
ObservableList.prototype.addRv = packrat.addRv;
ObservableList.prototype.flatten = flatten(rere);
ObservableList.tolist = tolist(rere);

return ObservableList;

};
});
define('rere/reactive/ReduceTree',[], function() {
return function(rere) {

var rv = rere.future("reactive/rv");
var Variable = rere.future("reactive/Variable");

return function(f) {
    function id(x) { return x; }
    var head = new (Variable())();
    
    this.root = null;
    this.base = null;
    this.baseMark = null;

    if (arguments.length==2) {
        this.head = (rv()).batch(head.bind(id).coalesce(arguments[1]));
    } else {
        this.head = (rv()).batch(head.bind(id));
    }
    

    this.add = function(key, value) {
        this.head.batch();
        this.checkInited();
        this.checkExpand();
        this.base[this.baseMark].watchRv(key, value);
        this.baseMark++;
        this.head.commit();
    };
    this.remove = function(key) {
        this.head.batch();
        for (var i=0;i<this.baseMark;i++) {
            if (this.base[i].source.key===key) {
                this.base[i].unset();
                if (i!=this.baseMark-1) {
                    key = this.base[this.baseMark-1].source.key;
                    value = this.base[this.baseMark-1].source.value;
                    this.base[this.baseMark-1].unset();
                    this.base[i].watchRv(key, value);
                }
                this.baseMark--
                break;
            }
        }
        this.head.commit();
    };
    this.checkInited = function() {
        if (this.root==null) {
            this.root = new Node(f);
            this.base = [this.root];
            this.baseMark = 0;
            head.set(this.root.data);
        }
    };
    this.checkExpand = function() {
        var self = this;

        if (this.baseMark<this.base.length) return;
        var root = new Node(f);
        root.childs.push({
            value: this.root
        });
        root.childs.push({
            value: cloneTreeStructure(this.root)
        });
        for (var child in root.childs) {
            root.childs[child].value.father = root;
        }
        root.bindChilds();
        this.root = root;
        expandBase();
        head.set(this.root.data);

        function expandBase() {
            self.base = [];
            walk(self.root);

            function walk(node) {
                if (node.childs.length==0) {
                    self.base.push(node);
                } else {
                    for (var child in node.childs) {
                        walk(node.childs[child].value);
                    }
                }
            }
        }

        function cloneTreeStructure(tree) {
            var clone = new Node(f);
            for (var child in tree.childs) {
                var child = cloneTreeStructure(tree.childs[child]);
                child.father = clone;
                clone.childs.push({
                    value: child
                });
            }
            return clone;
        }
    };
    this.dump = function() {
        this.checkInited();

        function dump(node) {
            if (node.isLeaf()) {
                if (node.data.value().isempty()) {
                    return "()"
                } else {
                    return "(=" + node.data.value().value() + ")";
                }
            } else {
                var result = "(";
                if (!node.data.value().isempty()) {
                    result = "(=" + node.data.value().value() + "  ";
                }
                result+=dump(node.childs[0].value);
                for(var i=1;i<node.childs.length;i++) {
                    result += "  " + dump(node.childs[i].value);
                }
                result += ")"
                return result;
            }
        }
    };
};

function Node(f) {
    this.father = null;
    this.childs = [];
    this.isActive = false;
    this.data = new (Variable())();
    this.dispose = null;
    this.bindChilds = function() {
        if (this.childs.length>2) throw new Error();
        
        var self = this;
        var wasActive = this.isActive;

        if (this.isActive) {
            this.dispose();
        }
        var active = this.childs.filter(function(child){
            return child.value.isActive;
        });
        
        if (active.length==0) {
            this.isActive = false;
        } else if (active.length==1) {
            this.isActive = true;
            var unsubscribe = this.data.follows(active[0].value.data);
            this.dispose = function() {
                unsubscribe();
                self.dispose = null;
            };
        } else {
            this.isActive = true;
            var combed = (rv()).sequenceMap([active[0].value.data, active[1].value.data], f);
            var unsubscribe = this.data.follows(combed);
            this.dispose = function() {
                unsubscribe();
                combed.dispose();
                self.dispose = null;
            };
        }
        if (wasActive && this.isActive) return;
        if (!wasActive && !this.isActive) return;
        if (this.father!=null) {
            this.father.bindChilds();
        }
    };
    this.watchRv = function(key, rv) {
        this.isActive = true;
        this.source = {
            key: key,
            value: rv,
            unsubscribe: this.data.follows(rv)
        };
        if (this.father!=null) {
            this.father.bindChilds();
        }
    };
    this.unset = function() {
        if (!this.isActive) throw new Error();
        if (!this.isLeaf()) throw new Error();
        this.isActive = false;
        this.source.unsubscribe();
        this.source = null;
        this.data.unset();
        if (this.father!=null) {
            this.father.bindChilds();
        }
    };
    this.isLeaf = function() {
        return this.childs.length==0;
    };
}

};
});

define('rere/reactive/rv',[], function() {
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
            if (!rv.value().isempty() && rv.value().value()!=value) {
                raise.apply(rv, [value]);
            }
        };

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
define('rere/reactive/reactive',
["rere/reactive/Variable", "rere/reactive/ObservableList", "rere/reactive/ReduceTree", "rere/reactive/rv"], 
function(Variable, ObservableList, ReduceTree, rv) {
return function(rere) {

return {
    "Variable" : Variable(rere),
    "ObservableList" : ObservableList(rere),
    "ReduceTree" : ReduceTree(rere),
    "rv" : rv(rere)
};

};
});

define('rere/ui/Element',[], function(){
return function(rere) {

return {
	setProperty: addDefault({
	    checked: function(view, value) {
	        return {
	            set: function(v) { 
	                view.checked = v; 
	            },
	            unset: function() { 
	                view.checked = false; 
	            }
	        };
	    }, 
        value: function(view, value) {
            return {
                set: function(v) {
                    if (view.value!=v) view.value = v;
                },
                unset: function() {
                    if (input.value!="") input.value = "";
                }
            };
        },
        "class": function(view, value) {
            var jq = rere.ui.jq;
            return {
                set: function(v) {
                    jq.removeClass(view);
                    view.classList.add(v);
                },
                unset: function() {
                    jq.removeClass(view);
                }
            };
        }
	}),
    renderSingle: function(element, view) {
        var jq = rere.ui.jq;
        var Variable = rere.reactive.Variable;
        var FragmentElement = rere.ui.elements.FragmentElement;

        for (var name in element.data.attributes) {
            if (name=="css") continue;
            
            rere.ui.Element.setProperty(view, name, element.data.attributes[name])
        }
        
        for (var name in element.data.events) {
            (function(name){
                if (name == "control:draw") return;
                if (name == "key:enter") {
                    view.addEventListener("keypress", function(event) {
                        if (event.keyCode == 13) {
                            element.data.events[name](element, view, event);
                        }
                    }, false);
                } else {
                    view.addEventListener(name, function(event) {
                        element.data.events[name](element, view, event);
                    }, false);
                }
            })(name);
        }

        if ("css" in element.data.attributes) {
            for (var property in element.data.attributes["css"]) {
                (function(property, value){
                    if (typeof value==="object" && value["rere/reactive/Channel"]) {
                        value.onEvent(Variable.handler({
                            set: function(e) { jq.css(view, property, e); },
                            unset: function() { jq.css(view, property, null); }
                        }))
                    } else {
                        jq.css(view, property, value);
                    };
                })(property, element.data.attributes["css"][property]);
            };
        };

        var events = {};
        if ("control:draw" in element.data.events) {
            events.draw = function() {
                element.data.events["control:draw"](element, view)
            };
        }
        return new FragmentElement(view, events);
    },
    renderContainer: function(element, view) {
        var renderer = rere.ui.elements.renderer;
        var Container = rere.ui.elements.Container;

        var fragment = rere.ui.Element.renderSingle(element, view);
        var bindto = fragment.bindto;
        fragment.bindto = function(head) {
            bindto.apply(fragment, [head]);
            renderer.render(element.data.content).bindto(new Container(view));
        };
        return fragment;
    },
    ctor: function() {
        this._ui_is = true;
        this.data = {
            content: {},
            attributes: {},
            events: {}
        };
        this.content = function(content) {
            this.data.content = content;
            return this;
        };
        this.attributes = function(attributes) {
            this.data.attributes = attributes
            return this;
        };
        this.events = function(events) {
            this.data.events = events
            return this;
        };
        this.get = function() {
            return this;
        };
    }
};

function addDefault(special) {
	function defaultMap(view, name, value) {
        return {
            set: function(v) { view.setAttribute(name, v); },
            unset: function() {
                if (view.hasAttribute(name)) {
                    view.removeAttribute(name);
                }
            }
        }
    }
    function wrapRv(value, template) {
        if (typeof value==="object" && value["rere/reactive/Channel"]) {
            value.onEvent(rere.reactive.Variable.handler({
                set: template.set,
                unset: template.unset
            }));
        } else {
            template.set(value);
        }
    }
    return function(view, name, value) {
        var setter = name in special ? special[name](view, value) : defaultMap(view, name, value);
        
        wrapRv(value, setter);
    };
}

};
});

define('rere/ui/jq',[], function() {
return function(rere) {

return {
    css: function(self, property, value){
        var getComputedStyle = document.defaultView.getComputedStyle;

        if (arguments.length < 3 && typeof property == 'string') {
            return self.style[camelize(property)] || getComputedStyle(self, '').getPropertyValue(property);
        }

        if (!value && value !== 0) {
            self.style.removeProperty(dasherize(property));
            return;
        }

        self.style.cssText += ';' + dasherize(property) + ":" + value;
    },
    removeClass: function(self, name) {
        if (!name) {
            while (self.classList.length > 0) self.classList.remove(self.classList.item(0));
        } else {
            self.classList.remove(name);
        }
    },
    after: function(self, element) {
        self.parentNode.insertBefore(element, self.nextSibling);
    },
    remove: function(self) {
        try {
            self.parentNode.removeChild(self);
        } catch (e) {
            throw e;
        }
    }
};

function camelize(str){ 
    return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' });
}

function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase();
}

};
});

define('rere/ui/initHtml',[], function() {
return function(rere) {

return function(renderer) {
    renderer.addPithyTag("div");
    renderer.addPithyTag("span");
    renderer.addPithyTag("label");
    renderer.addPithyTag("button");
    renderer.addPithyTag("form");
    renderer.addPithyTag("ul");
    renderer.addPithyTag("li");
    renderer.addPithyTag("table");
    renderer.addPithyTag("tr");
    renderer.addPithyTag("td");
    renderer.addPithyTag("a");
    renderer.addPithyTag("section");
    renderer.addPithyTag("header");
    renderer.addPithyTag("footer");
    renderer.addPithyTag("h1");
    renderer.addPithyTag("strong");
    renderer.addPithyTag("option");
    renderer.addPithyTag("sup");
    renderer.addPithyTag("sub");

    renderer.addVoidTag("input-radio", function(state) { return new InputCheck(state, "radio"); })
    renderer.addVoidTag("input-check", function(state) { return new InputCheck(state, "checkbox"); })
    renderer.addVoidTag("input-text", function(state) { return new InputText(state); })
    renderer.addPithyTag("combobox", function(state) { return new ComboBox(state); })

    renderer.addTag("text", null, function(info) {
        if (typeof info.casual[0] == 'string' || info.casual[0] instanceof String) {
            return new rere.ui.Text(info.casual[0]);
        } else {
            return renderer.parse(renderer.h(info.casual[0].lift(function(text){
                return renderer.h(new rere.ui.Text(text));
            })));
        }
    });

    return renderer;

    function InputCheck(state, type) {
        if (!type) {
            throw new Error("type must be provider");
        }
        if (!(type in {checkbox: 0, radio: 0})) throw new Error("type must be checkbox or radio")
        rere.ui.Input.apply(this, []);
        state = state || new Variable();

        this.get = function() {
            var self = this;
            this.data.attributes.type=type;
            this.data.attributes.checked = state.coalesce(false);
            var change = this.data.events.change || function(){};
            var checked = this.data.events["rere:checked"] || function(){};
            var unchecked = this.data.events["rere:unchecked"] || function(){};
            delete this.data.events["rere:checked"];
            delete this.data.events["rere:unchecked"];
            this.data.events.change = function(control, view) {
                change.apply(self.data.events, [control, view]);
                if (view.checked) {
                    checked();
                } else {
                    unchecked();
                }
                state.set(view.checked);
            };

            return this;
        }
    }

    function InputText(state) {
        rere.ui.Input.apply(this, []);

        this.get = function() {
            var self = this;
            this.data.attributes.type="text";
            this.data.attributes.value = state;
            var input = "input" in this.data.events ? this.data.events.input : function(){};
            this.data.events.input = function(control, view) {
                input.apply(self.data.events, [control, view]);
                state.set(view.value);
            };

            return this;
        }
    }

    function ComboBox(state) {
        rere.ui.Element.ctor.apply(this);

        this.get = function() {
            var self = this;
            this.data.attributes.value = state;
            var change = "change" in this.data.events ? this.data.events.change : function(){};
            this.data.events.change = function(control, view) {
                change.apply(self.data.events, [control, view]);
                state.set(view.value);
            };
            return this;
        };

        this.view = function(element){
            return rere.ui.Element.renderContainer(element, document.createElement("select"));
        };
    }
}

};
});

define('rere/ui/renderer',["rere/ui/initHtml"], function(initHtml){
return function(rere) {

var renderer = build();

return initHtml(rere)(renderer);

function build() {
    return {
        h : (function(){
            var h = function(element) {
                return {
                    _is_html_element: true,
                    element: element
                }
            };
            h.at = function(attributes) {
                return {
                    _is_html_at: true,
                    attributes: attributes
                }
            };
            h.e = function(events) {
                return {
                    _is_html_events: true,
                    events: events
                }
            };
            h.s = function(state) {
                return {
                    _is_html_state: true,
                    state: state
                }
            }
            return h;
        })(),
        tags: {},
        addTag: function(name, factory, builder) {
            this.tags[name]={ factory: factory, builder: builder }
        },
        tag: function(name) {
            return this.tags[name].factory;
        },
        addPithyTag: function(tag, factory) {
            var renderer = this;
            factory = factory || function() {
                return new function() {
                    rere.ui.Element.ctor.apply(this);
                    this.view = function(element){
                        return rere.ui.Element.renderContainer(element, document.createElement(tag));
                    };
                };
            };
            renderer.addTag(tag, factory, function(info){
                var element = info.state ? factory(info.state) : factory();
                if (info.attributes) element.attributes(info.attributes);
                if (info.events) element.events(info.events);

                element.content(info.casual.map(function(item){
                    if (typeof item == 'string' || item instanceof String) {
                        return new rere.ui.Text(item);
                    } else {
                        return renderer.parse(item);
                    }
                }));
                return element.get();
            });
        },
        addVoidTag : function(tag, factory) {
            var renderer = this;
            factory = factory || function() {
                return new function() {
                    rere.ui.Element.ctor.apply(this);
                    this.view = function(element){
                        return rere.ui.Element.renderSingle(element, document.createElement(tag));
                    };
                };
            };
            renderer.addTag(tag, factory, function(info){
                var element = info.state ? factory(info.state) : factory();
                if (info.attributes) element.attributes(info.attributes);
                if (info.events) element.events(info.events);
                return element.get();
            });
        },
        parse: function(element) {
            var self = this;
            function lift(e) {
                if (e["_is_html_element"]) {
                    return flow(e.element);
                } else if (e["rere/reactive/Channel"]) {
                    return e.lift(function(v){
                        return lift(v);
                    });
                } else if (e instanceof Array ) {
                    return e.map(flow);
                } else if (e["_m_is_maybe"] ) {
                    return e.lift(flow);
                } else if (e["rere/reactive/ObservableList"] ) {
                    return e.lift(lift);
                } else {
                    throw Error();
                }
            }
            function flow(e) {
                if (e instanceof Array ) {
                    if (e.length==0) throw new Error("Where is the tag name?");
                    if (!(e[0] in self.tags)) {
                        throw new Error("Unknown tag: " + e[0]);
                    }
                    return self.tags[e[0]].builder(parseSpecial(e))
                } else if (e["_is_html_element"]) {
                    return lift(e.element);
                } else {
                    return e;
                }

                function parseSpecial(args) {
                    var result = {
                        /*attributes: {},
                        events: {},
                        state:*/
                        casual: []
                    };
                    for (var i=1;i<args.length;i++) {
                        if ((typeof args[i] === "object")&&(args[i]._is_html_at)) {
                            if (result.attributes) throw new Error("attributes may be set only once");
                            result.attributes = args[i].attributes;
                            continue;
                        }
                        if ((typeof args[i] === "object")&&(args[i]._is_html_events)) {
                            if (result.events) throw new Error("events may be set only once");
                            result.events = args[i].events;
                            continue;
                        }
                        if ((typeof args[i] === "object")&&(args[i]._is_html_state)) {
                            if ("state" in result) throw new Error("state may be set only once");
                            result.state = args[i].state;
                            continue;
                        }
                        result.casual.push(args[i]);
                    }
                    return result;
                }
            }
            return flow(element);
        },
        render : function(canvas, element) {
            var renderer = rere.ui.elements.renderer;
            var Container = rere.ui.elements.Container;

            renderer.render(this.parse(element)).bindto(new Container(canvas));
        }
    };
}

};
});

define('rere/ui/StickyButton',[], function(){
return function(rere){

return {
    oneof: function(buttons) {
        for(var idx in buttons) {
            (function(i){
                buttons[i].onEvent(function(e){
                    if (e[0]==="set" && e[1]===true) {
                        for (var j in buttons) {
                            if (j==i) continue;
                            buttons[j].set(false);
                        }
                    }
                });
            })(idx);
        }
    }
};

};
});

define('rere/ui/elements/Container',[],function() {
return function(rere) {

return function(container) {
    this.bindto = function(element) {
        throw new Error();
    };
    this.place = function(html) {
        if (container.childNodes.length==0) {
            container.appendChild(html);
        } else {
            container.insertBefore(html, container.childNodes.item(0));
        }
    };
};

};
});

define('rere/ui/elements/FragmentElement',[], function() {
return function(rere) {

return function(fragment, events) {
	var jq = rere.ui.jq;

    this.head = null;
    this.bindto = function(element) {
        element.place(fragment);
        this.head = element;
        if (events && events.draw) events.draw();
    };
    this.place = function(html) {
        jq.after(fragment, html);
    };
    this.remove = function() {
        jq.remove(fragment);
        this.place = function(html) {
            this.head.place(html);
        };
    };
};

};
});

define('rere/ui/elements/ListElement',[], function() {
return function(rere) {

return function(elements) {
    this.last = null;
    this.head = null;
    this.bindto = function(element) {
        this.head = element;
        var previous = element;
        for (var i=0;i<elements.length;i++) {
            elements[i].bindto(previous);
            previous = elements[i];
            this.last = previous;
        }
    };
    this.place = function(html) {
        if (this.last != null) {
            this.last.place(html);
        } else {
            this.head.place(html);
        }
    };
    this.remove = function() {
        for (var i=0;i<elements.length;i++) {
            elements[i].remove();
        }
    };
}

};
});
define('rere/ui/elements/MaybeElement',[], function() {
return function(rere) {

return (function(renderer, maybe) {
    var self = this;
    this.last = null;
    this.head = null;
    this.bindto = function(element) {
        this.head = element;
        if (!maybe.isempty()) {
            self.last = renderer.render(maybe.value());
            self.last.bindto(element);
        }
    };
    this.place = function(html) {
        if (this.last==null) {
            this.head.place(html);
        } else {
            this.last.place(html);
        }
    };
    this.remove = function() {
        if (this.last!=null) {
            this.last.remove()
        }
    };
});

};
});

define('rere/ui/elements/ObservableListElement',[], function() {
return function(rere) {

return function(list) {
    var FragmentElement = rere.ui.elements.FragmentElement;

    this.last = new FragmentElement(document.createElement("span"));
    this.head = null;
    this.elements = null;
    this.hash = {};
    this.bindto = function(element) {
        var self = this;
        this.head = element;
        this.last.bindto(this.head);
        list.subscribe(function(event){
            if (event[0]=="data") {
                if (self.elements!=null) {
                    for (var i=0;i<self.elements.length;i++) {
                        self.elements[i].value.remove();
                    }
                }
                var previous = self.head;
                for (var i=0;i<event[1].length;i++) {
                    self.hash[event[1][i].key] = event[1][i];
                    event[1][i].value.bindto(previous);
                    previous = event[1][i].value;
                }
                self.elements = event[1]
            } else if (event[0]=="add") {
                if (self.elements.length==0) {
                    event[1].value.bindto(self.head);
                } else {
                    event[1].value.bindto(self.elements[self.elements.length-1].value);
                }
                self.elements.push(event[1]);
                self.hash[event[1].key] = event[1]
            } else if (event[0]=="remove") {
                if (event[1] in self.hash) {
                    self.hash[event[1]].value.remove();
                    delete self.hash[event[1]];
                } else {
                    console.log("Dirty behaviour");
                }
            } else {
                throw new Error();
            }
        })
    };
    this.place = function(html) {
        this.last.place(html);
    };
    this.remove = function() {
        this.last.remove();
        this.place = function(html) {
            this.head.place(html);
        };
    };
};

};
});

define('rere/ui/elements/RvElement',[], function() {
return function(rere) {

return (function(renderer, rv) {
    var Variable = rere.reactive.Variable;

    var self = this;
    this.last = null;
    this.head = null;
    this.dispose = function() {};
    this.bindto = function(element) {
        this.head = element;
        
        self.dispose = rv.onEvent(Variable.handler({
            set: function(e) {
                if (self.last!=null) {
                    self.last.remove();
                };
                self.last = renderer.render(e);
                self.last.bindto(element);
            },
            unset: function() {
                if (self.last!=null) {
                    self.last.remove();
                    self.last = null;
                };
            }
        }));
    };
    this.place = function(html) {
        if (this.last==null) {
            this.head.place(html);
        } else {
            this.last.place(html);
        }
    };
    this.remove = function() {
        self.dispose();
        if (self.last!=null) {
            self.last.remove();
            self.last = null;
        };
    };
});

};
});

define('rere/ui/elements/renderer',[], function() {
return function(rere) {

return {
    render : function(element) {
        var renderer = rere.ui.elements.renderer;
        var ListElement = rere.ui.elements.ListElement;
        var RvElement = rere.ui.elements.RvElement;
        var MaybeElement = rere.ui.elements.MaybeElement;
        var ObservableListElement = rere.ui.elements.ObservableListElement;

        var self = this;
        if (element instanceof Array) {
            return new ListElement(element.map(function(e){
                return self.render(e)
            }));
        }

        if (element._ui_is) {
            return element.view(element);
        } else if (element["_m_is_maybe"]) {
            return new MaybeElement(renderer, element)
        } else if (element["rere/reactive/Channel"]) {
            return new RvElement(renderer, element);
        } else if (element["rere/reactive/ObservableList"]) {
            return new ObservableListElement(element.lift(function(e){
                return self.render(e)
            }));
        } else if (typeof(element) == "function") {
            return element(renderer);
        } else {
            throw new Error();
        }
    }
};

};
});

define('rere/ui/elements/elements',
[
  "rere/ui/elements/Container", 
  "rere/ui/elements/FragmentElement", 
  "rere/ui/elements/ListElement", 
  "rere/ui/elements/MaybeElement", 
  "rere/ui/elements/ObservableListElement", 
  "rere/ui/elements/RvElement", 
  "rere/ui/elements/renderer"], 
function(
  Container, 
  FragmentElement, 
  ListElement, 
  MaybeElement, 
  ObservableListElement, 
  RvElement, 
  renderer) {
return function(rere) {

return {
    Container: Container(rere), 
    FragmentElement: FragmentElement(rere), 
    ListElement: ListElement(rere), 
    MaybeElement: MaybeElement(rere), 
    ObservableListElement: ObservableListElement(rere), 
    RvElement: RvElement(rere), 
    renderer: renderer(rere)
};

};
});

define('rere/ui/hacks',[], function() {
return function(rere) {

return {
    // https://gist.github.com/rystsov/5898584
    // https://code.google.com/p/chromium/issues/detail?id=117307
    unrecursion: function(f) {
        var active = false;
        return function() {
            if (active) return;
            active = true;
            f.apply(null, arguments);
            active = false;
        }
    }
};

};
});

define('rere/ui/ui',
[
  "rere/ui/Element",

  "rere/ui/jq",
  "rere/ui/renderer",

  "rere/ui/StickyButton", 

  "rere/ui/elements/elements",
  "rere/ui/hacks"],
function() {
var args = arguments;
return function(rere) {

var obj = rere.collect(args, [
  "Element", "jq", "renderer", "StickyButton", "elements", "hacks"
]);

obj.Input = single("input");
obj.Text = function(text) {
    this._ui_is = true;
    this.view = function() {
        var FragmentElement = rere.ui.elements.FragmentElement;
        return new FragmentElement(document.createTextNode(text));
    }
};

return obj;

function single(tag) {
    return function() {
        rere.ui.Element.ctor.apply(this);
        this.view = function(element){
            return rere.ui.Element.renderSingle(element, document.createElement(tag));
        };
    };
}

};
});

define('rere/rere',
["rere/adt/adt", "rere/reactive/reactive", "rere/ui/ui"], 
function(adt, reactive, ui) {

var rere = {
    utils: {
        vectorAdd: function(a,b) {
            if (a.length!= b.length) throw new Error();
            var c = [];
            for (var i in a) {
                c.push(a[i]+b[i]);
            }
            return c;
        }
    }
}

rere.future = function(path) {
	var parts = path.split("/")
	return function() {
		var obj = rere;
		for (var i=0;i<parts.length;i++) {
			obj = obj[parts[i]];
		}
		return obj;
	}
};
rere.collect = function(ctors, names) {
	if (names.length!=ctors.length) throw new Error();
	var obj = {};
	for (var i=0;i<names.length;i++) {
		obj[names[i]] = ctors[i](rere);
	}
	return obj;
};
rere.adt = adt(rere);
rere.reactive = reactive(rere);
rere.ui = ui(rere);
return rere;

});
