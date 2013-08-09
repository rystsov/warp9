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
	}),
    renderSingle: function(element, view) {
        var jq = rere.ui.jq;
        var Cell = rere.reactive.Cell;
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
                    if (typeof value==="object" && value.type == Cell) {
                        value.onEvent(Cell.handler({
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
        if (typeof value==="object" && value.type == Cell) {
            value.onEvent([], rere.reactive.Cell.handler({
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
        if (typeof info.state == 'string' || info.state instanceof String) {
            return new rere.ui.Text(info.state);
        } else {
            return renderer.parse(renderer.h(info.state.lift(function(text){
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
                } else if (typeof e==="object" && e.type == rere.reactive.Cell) {
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
                    console.log("Dirty behaviour, find dirty behaviour like this isolated at ~/issues/ObservableListElement/doubleDelete.html");
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
        } else if (typeof element==="object" && element.type == rere.reactive.Cell) {
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

  "rere/ui/elements/elements",
  "rere/ui/hacks"],
function() {
var args = arguments;
return function(rere) {

var obj = rere.collect(args, [
  "Element", "jq", "renderer", "elements", "hacks"
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

var rere = null;
require(["rere/rere"], function(rr){
    rere = rr;
});
return rere;

})();
