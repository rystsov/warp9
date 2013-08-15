var rere = (function(){

var modules = {};
var cache = {};

function resolve(dependencies) {
    return dependencies.map(function(dependency){
        if (!(dependency in modules)) throw new Error("Unknown module: " + dependency);
        if (!(dependency in cache)) {
            cache[dependency] = modules[dependency].unit.apply(null, resolve(modules[dependency].dependencies));
        }
        return cache[dependency];
    });
}

function define(what, dependencies, unit) {
    if (arguments.length!=3) throw new Error("Bad count of arguments for: " + what);
    if (what in modules) throw new Error("Module \"" + what + "\" already known");
    modules[what] = {
        dependencies: dependencies,
        unit: unit
    };
}

function require(dependencies, app) {
    app.apply(null, resolve(dependencies));
}

define('rere/adt/maybe',[], function() {
return function(rere) {

return {
    "Some": (function Some(value) {
        this.value = function() {
            return value;
        };
        this.isEmpty = function() {
            return false;
        };
        this.lift = function(f) {
            return new Some(f(value));
        };
    }),
    "None": function() {
        this.value = function() {
            throw new Error();
        };
        this.isEmpty = function() {
            return true;
        };
        this.lift = function() {
            return this;
        };
    }
};

};
});

define('rere/adt/adt',
["rere/adt/maybe"],
function(maybe) {
return function(rere) {

return {
    maybe : maybe(rere)
};

};
});

define('rere/reactive/Cell',[],function() {
return function(rere) {

var maybe = rere.adt.maybe;

var id = 0;

function Cell() {
    var dependantsId = 0;

    this.id = id++;

    // used in garbage collection
    this.isActive = true;
    this.isUsed = false;
    this.isGarbage = false;

    this.type = Cell;
    this.content = new maybe.None();
    this.dependants   = [];
    this.dependanties = [];

    // used in debug propose only
    this.name = function() {
        if (arguments.length==0) {
            if (this._name) {
                return this.id + "(" + this._name + ")";
            }
            return this.id;
        }
        this._name = arguments[0];
        return this;
    };

    this.activate = function() {
        if (this.isActive) return;
        throw new Error();
    }

    this.subscribe = function(f) {
        return this.onEvent([], function(e){
            if (e[0]==="set") {
                f(e[1]);
            }
        });
    };

    // unsubscribe is called by GC, when it wants to uncut refs to dependants (if they all are garbage)
    // unsubscribe expects function that will remove dependant record from this.dependants
    // unsubscribe is never called if dependants is empty
    this.onEvent = function(dependants, f, unsubscribe) {
        var self = this;
        unsubscribe = unsubscribe || function(f) {
            f();
        };
        var id = dependantsId++;
        this.dependants.push({key: id, dependants: dependants, f:f, unsubscribe: unsubscribe});
        if (this.content.isEmpty()) {
            f(["unset"]);
        } else {
            f(["set", this.content.value()]);
        }
        return function() {
            self.dependants = self.dependants.filter(function(dependant) {
                return dependant.key!=id;
            });
        };
    };

    this.set = function(value) {
        this.content = new maybe.Some(value)
        Cell.raise(this, ["set", value])
    };
    this.unset = function() {
        this.content = new maybe.None();
        Cell.raise(this, ["unset"])
    };

    if (arguments.length>0) {
        this.set(arguments[0])
    }
}

Cell.prototype.unwrap = function(alt) {
    if (arguments.length==0 && this.content.isEmpty()) throw new Error();
    return this.content.isEmpty() ? alt : this.content.value();
};

Cell.prototype.lift = function(f) {
    var self = this;

    var channel = new Cell()
    var forget = function(unsubscribe) {
        channel.isActive = false;
        channel.dependanties = [];
        unsubscribe();
    };
    channel.isActive = false;
    channel.activate = function() {
        if (this.isActive) return;
        self.activate();
        channel.isActive = true;
        channel.dependanties = [self];
        self.onEvent([channel], function(e){
            Cell.replay(channel, e, f);
        }, forget);
    };
    channel.activate();

    return channel;
};

Cell.prototype.bind = function(f) {
    var self = this;

    var result = new Cell();
    var dispose = function() {};
    var forget = function(unsubscribe) {
        dispose();
        result.isActive = false;
        result.dependanties = [];
        unsubscribe();
    };
    result.isActive = false;
    result.activate = function() {
        if (this.isActive) return;
        self.activate();
        result.isActive = true;
        result.dependanties = [self];
        self.onEvent([result], Cell.handler({
            set: function(e) {
                dispose();
                var leader = f(e);
                leader.activate();
                result.dependanties = [self, leader];
                dispose = leader.onEvent([result], Cell.handler(result));
            },
            unset: function(){
                dispose();
                result.dependanties = [self];
                dispose = function() {};
                result.unset();
            }
        }), forget);
    };
    result.activate();
    return result;
};

Cell.raise = function(self, e) {
    for (var i in self.dependants) {
        var f = self.dependants[i].f;
        f(e);
    }
};

Cell.replay = function (self, e, f) {
    if (e[0]==="set") {
        self.set(f(e[1]));
    } else if (e[0]==="unset") {
        self.unset()
    } else {
        throw new Error();
    }
};

Cell.handler = function(handler) {
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

return Cell;

};
});

define('rere/reactive/GC',[],function() {
return function(rere) {

return {
    era: 0,
    count: function() {
        var memory = {}
        function counter(rv) {
            memory[rv.id] = rv;
            rv.dependants.map(function(dep) {
                dep.dependants.map(counter)
            });
        }
        for (var i=0;i<arguments.length;i++) {
            if (arguments[i].type != rere.reactive.Cell) throw new Error();
            counter(arguments[i]);
        }
        var total = 0;
        for (var i in memory) total+=1;
        return total;
    },
    collect: function() {
        var GC = this;
        function markGarbageCollectUsed(rv, used) {
            rv.era = GC.era;
            rv.isGarbage = true;
            if (rv.isUsed) {
                used.push(rv);
            }
            for (var i in rv.dependants) {
                for (var j in rv.dependants[i].dependants) {
                    markGarbageCollectUsed(rv.dependants[i].dependants[j], used);
                }
            }
        }
        function unGarbageAncestors(rv) {
            if (rv.era==GC.era) return;

            rv.isGarbage = false;
            rv.era = GC.era;
            for (var i in rv.dependanties) {
                unGarbageAncestors(rv.dependanties[i]);
            }
        }
        function cutGarbage(rv) {
            var items = rv.dependants;
            for (var i in items) {
                var item = items[i];

                var isGarbage = item.dependants.length > 0;
                for (var j in item.dependants) {
                    if (!item.dependants[j].isGarbage) {
                        isGarbage = false;
                        break;
                    }
                }
                if (isGarbage) {
                    var id = item.key;
                    item.unsubscribe(function(){
                        rv.dependants = rv.dependants.filter(function(dependant) {
                            return dependant.key!=id;
                        });
                    });
                } else {
                    for (var j in item.dependants) {
                        cutGarbage(item.dependants[j]);
                    }
                }
            }
        }

        var used = [];
        for (var i in arguments) {
            markGarbageCollectUsed(arguments[i], used);
        }
        GC.era++;
        for (var i in used) {
            unGarbageAncestors(used[i])
        }
        for (var i in arguments) {
            cutGarbage(arguments[i]);
        }
    },
    printFullDependencies: function(rv) {
        function collect(rv) {
            var result = {
                name: rv.name(),
                dependants: []
            };
            var dependants = {}
            for (var i in rv.dependants) {
                for (var j in rv.dependants[i].dependants) {
                    dependants[rv.dependants[i].dependants[j].id] = rv.dependants[i].dependants[j];
                }
            }
            for (var i in dependants) {
                result.dependants.push(collect(dependants[i]))
            }
            return result;
        }
        function print(info, offset) {
            console.info(offset + info.name + (info.dependants.length==0 ? "" : ":"))
            info.dependants.map(function(x) { print(x, offset + "  "); })
        }

        print(collect(rv), "");
    }
}

};
});


define('rere/reactive/reactive',
["rere/reactive/Cell", "rere/reactive/GC"],
function(Cell, GC) {
return function(rere) {

return {
    Cell : Cell(rere),
    GC : GC(rere)
};

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
define('rere/ui/elements/RvElement',[], function() {
return function(rere) {

return (function(rv) {
    var Cell = rere.reactive.Cell;

    var self = this;
    this.last = null;
    this.head = null;
    this.dispose = function() {};
    this.bindto = function(element) {
        this.head = element;
        
        self.dispose = rv.onEvent([], Cell.handler({
            set: function(e) {
                if (self.last!=null) {
                    self.last.remove();
                };
                self.last = e;
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

define('rere/ui/elements/elements',
[
  "rere/ui/elements/Container",
  "rere/ui/elements/ListElement",
  "rere/ui/elements/RvElement"],
function(
  Container,
  ListElement, 
  RvElement) {
return function(rere) {

return {
    Container: Container(rere), 
    ListElement: ListElement(rere),
    RvElement: RvElement(rere)
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

define('rere/ui/HtmlDom',[], function() {
return function(rere) {

return {
    wrap : function(element) {
        var Cell = rere.reactive.Cell;
        var HtmlElement = rere.ui.HtmlElement;
        var HtmlDomElement = rere.ui.HtmlDomElement;
        var ListElement = rere.ui.elements.ListElement;
        var RvElement = rere.ui.elements.RvElement;
        var HtmlTextNode = rere.ui.HtmlTextNode;

        if (element instanceof Array) {
            return new ListElement(element.map(rere.ui.HtmlDom.wrap));
        }
        if (typeof element=="object" && element.type==HtmlElement) {
            return new HtmlDomElement(element);
        }
        if (typeof element=="object" && element.type==HtmlTextNode) {
            return new HtmlDomElement(element);
        }
        if (typeof element=="object" && element.type==Cell) {
            return new RvElement(element.lift(rere.ui.HtmlDom.wrap));
        }

        throw new Error();
    }
};

};
});

define('rere/ui/HtmlDomElement',[], function(){
return function(rere) {

function HtmlDomElement(element) {
    var jq = rere.ui.jq;
    var Container = rere.ui.elements.Container;

    this.bindto = function(preceding) {
        if ("preceding" in this) throw new Error();
        this.preceding = preceding;
        this.view = element.view();
        preceding.place(this.view);

        if (element.children instanceof Array) {
            if (element.children.length!=0) {
                rere.ui.HtmlDom.wrap(element.children).bindto(new Container(this.view));
            }
        } else {
            throw new Error();
        }

        if ("control:draw" in element.events) {
            element.events["control:draw"](element, this.view);
        }
    };
    this.place = function(follower) {
        if (!("preceding" in this)) throw new Error();
        jq.after(this.view, follower);
    };
    this.remove = function() {
        if (!("preceding" in this)) throw new Error();
        jq.remove(this.view);
        element.dispose();
        this.place = function(follower) { this.preceding.place(follower); };
        this.remove = function() { throw new Error(); }
    };
}

return HtmlDomElement;

};
});

define('rere/ui/HtmlElement',[], function(){
return function(rere) {


function HtmlElement(tag) {
    var jq = rere.ui.jq;
    var Cell = rere.reactive.Cell;

    this.type = HtmlElement;
    this.tag = tag;
    this.attributes = {};
    this.events = {};
    this.children = [];

    this.attributeSetters = defaultAttributeSetters();

    this.dispose = function() {};
    this.view = function() {
        var view = document.createElement(tag);

        for (var name in this.attributes) {
            if (name=="css") continue;
            this.setAttribute(view, name, this.attributes[name])
        }

        for (var name in this.events) {
            (function(name){
                if (name == "control:draw") return;
                if (name == "key:enter") {
                    view.addEventListener("keypress", function(event) {
                        if (event.keyCode == 13) {
                            this.events[name](this, view, event);
                        }
                    }.bind(this), false);
                } else {
                    view.addEventListener(name, function(event) {
                        this.events[name](this, view, event);
                    }.bind(this), false);
                }
            }.bind(this))(name);
        }

        if ("css" in this.attributes) {
            for (var property in this.attributes["css"]) {
                (function(property, value){
                    if (typeof value==="object" && value.type == Cell) {
                        value.onEvent(Cell.handler({
                            set: function(e) { jq.css(view, property, e); },
                            unset: function() { jq.css(view, property, null); }
                        }));
                    } else {
                        jq.css(view, property, value);
                    }
                })(property, this.attributes["css"][property]);
            }
        }

        this.view = function() {
            throw new Error();
        };

        return view;
    };
    this.setAttribute = function(view, name, value) {
        if (name in this.attributeSetters) {
            wrapRv(value, this.attributeSetters[name](view));
        } else {
            wrapRv(value, defaultMap(view, name));
        }

        function defaultMap(view, name) {
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
            if (typeof value==="object" && value.type == Cell) {
                value.onEvent([], rere.reactive.Cell.handler({
                    set: template.set,
                    unset: template.unset
                }));
            } else {
                template.set(value);
            }
        }
    };
}

return HtmlElement;

function defaultAttributeSetters() {
    return {
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
                    if (view.value!="") view.value = "";
                }
            };
        },
        disabled: function(view, value) {
            return {
                set: function(v) {
                    if (v) {
                        view.setAttribute("disabled", "")
                    } else {
                        if (view.hasAttribute("disabled")) view.removeAttribute("disabled");
                    }
                },
                unset: function() {
                    view.removeAttribute("disabled");
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
    };
}

};
});

define('rere/ui/renderer',[], function(){
return function(rere) {

var renderer = {
    h: function(element) { return new H(element); },
    tags: {
        "div": tag("div"),
        "input-text": inputText
    },
    parse: function(element) {
        var Cell = rere.reactive.Cell;

        if (typeof element==="string" || element instanceof String) {
            return new rere.ui.HtmlTextNode(element);
        }
        if (element instanceof Array) {
            if (element.length==0) throw new Error();
            var tag = element[0];
            if (!(tag in this.tags)) throw new Error("Unknown tag: " + tag);
            return this.tags[tag](element.slice(1));
        }
        if (typeof element==="object" && element.type==Cell) {
            return element.lift(this.parse.bind(this));
        }

        throw new Error();
    },
    render : function(canvas, element) {
        var Container = rere.ui.elements.Container;

        rere.ui.HtmlDom.wrap(this.parse(element)).bindto(new Container(canvas));
    }
};

return renderer;

function H(element) {
    this.element = element
}

function tag(tagName) {
    return function(args) {
        var args = parseTagArgs(args);
        var element = new rere.ui.HtmlElement(tagName);
        setAttrEvents(element, args.attr);
        element.children = [];
        for (var i in args.children) {
            var child = args.children[i];
            child = rere.ui.renderer.parse(child);
            element.children.push(child);
        }
        return element;
    };
}

function inputText(args) {
    var Cell = rere.reactive.Cell;
    args = parseTagArgs(args);
    if (args.children.length != 1) throw new Error();
    var value = args.children[0];
    if (!(typeof value==="object" && value.type==Cell)) throw new Error();

    var element = new rere.ui.HtmlElement("input");
    setAttrEvents(element, args.attr);
    element.attributes.type = "text";
    element.attributes.value = value;
    var input = "input" in element.events ? element.events.input : function(){};
    element.events.input = function(control, view) {
        input.apply(element.events, [control, view]);
        value.set(view.value);
    };

    return element;
}

function parseTagArgs(args) {
    var Cell = rere.reactive.Cell;
    if (args.length==0) throw new Error();

    var children = [args[0]];
    var attr = null;

    while(true) {
        if (typeof args[0]==="string" || args[0] instanceof Array) break;
        if (args[0] instanceof Array) break;
        if (args[0] instanceof Object && args[0].type==Cell) break;
        if (args[0] instanceof H) break;
        children = [];
        attr = args[0];
        break;
    }

    for (var i=1;i<args.length;i++) {
        children.push(args[i]);
    }

    if (children.length==1) {
        if (children[0] instanceof H) {
            children = children[0].element;
        }
    }

    return {attr: attr, children: children};
}

function setAttrEvents(element, attr) {
    if (attr!=null) {
        for (var name in attr) {
            if (typeof attr[name]==="function") {
                element.events[name] = attr[name];
                continue;
            }
            element.attributes[name] = attr[name];
        }
    }
}

};
});

define('rere/ui/HtmlTextNode',[], function(){
return function(rere) {


function HtmlTextNode(text) {
    this.type = HtmlTextNode;
    this.dispose = function() {};
    this.children = [];
    this.events = {};
    this.view = function() {
        var view = document.createTextNode(text);

        this.view = function() {
            throw new Error();
        };

        return view;
    };
}

return HtmlTextNode;

};
});

define('rere/ui/ui',
[
  "rere/ui/jq",
  "rere/ui/elements/elements",
  "rere/ui/hacks",
  "rere/ui/HtmlDom",
  "rere/ui/HtmlDomElement",
  "rere/ui/HtmlElement",
  "rere/ui/renderer",
  "rere/ui/HtmlTextNode"],
function() {
var args = arguments;
return function(rere) {

var obj = rere.collect(args, [
  "jq", "elements", "hacks", "HtmlDom", "HtmlDomElement", "HtmlElement", "renderer", "HtmlTextNode"
]);

return obj;

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

var rere = null;
require(["rere/rere"], function(rr){
    rere = rr;
});
return rere;

})();
