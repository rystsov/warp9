var rere = (function(){
    var files = [{ path:["ui", "renderer"], content: function(root, expose) {
expose({
    h: h,
    parse: parse,
    render: render
});

var tags = {
    "div": tag("div"),
    "input-text": inputText
};

function h(element) { return new H(element); }

function parse(element) {
    var Cell = root.reactive.Cell;

    if (typeof element==="string" || element instanceof String) {
        return new root.ui.HtmlTextNode(element);
    }
    if (element instanceof Array) {
        if (element.length==0) throw new Error();
        var tag = element[0];
        if (!(tag in tags)) throw new Error("Unknown tag: " + tag);
        return tags[tag](element.slice(1));
    }
    if (typeof element==="object" && element.type==Cell) {
        return element.lift(parse);
    }

    throw new Error();
}

function render(canvas, element) {
    var Container = root.ui.elements.Container;

    root.ui.HtmlDom.wrap(parse(element)).bindto(new Container(canvas));
}


function H(element) {
    this.element = element
}

function tag(tagName) {
    return function(args) {
        var args = parseTagArgs(args);
        var element = new root.ui.HtmlElement(tagName);
        setAttrEvents(element, args.attr);
        element.children = [];
        for (var i in args.children) {
            var child = args.children[i];
            child = root.ui.renderer.parse(child);
            element.children.push(child);
        }
        return element;
    };
}

function inputText(args) {
    var Cell = root.reactive.Cell;
    args = parseTagArgs(args);
    if (args.children.length != 1) throw new Error();
    var value = args.children[0];
    if (!(typeof value==="object" && value.type==Cell)) throw new Error();

    var element = new root.ui.HtmlElement("input");
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
    var Cell = root.reactive.Cell;
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

}
},{ path:["ui", "hacks"], content: function(root, expose) {
expose({unrecursion: unrecursion});

// https://gist.github.com/rystsov/5898584
// https://code.google.com/p/chromium/issues/detail?id=117307
function unrecursion(f) {
    var active = false;
    return function() {
        if (active) return;
        active = true;
        f.apply(null, arguments);
        active = false;
    };
}

}
},{ path:["ui", "HtmlTextNode"], content: function(root, expose) {
expose(HtmlTextNode);

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
}
},{ path:["ui", "HtmlDom"], content: function(root, expose) {
expose({wrap: wrap});

function wrap(element) {
    var Cell = root.reactive.Cell;
    var HtmlElement = root.ui.HtmlElement;
    var HtmlDomElement = root.ui.HtmlDomElement;
    var ListElement = root.ui.elements.ListElement;
    var RvElement = root.ui.elements.RvElement;
    var HtmlTextNode = root.ui.HtmlTextNode;

    if (element instanceof Array) {
        return new ListElement(element.map(wrap));
    }
    if (typeof element=="object" && element.type==HtmlElement) {
        return new HtmlDomElement(element);
    }
    if (typeof element=="object" && element.type==HtmlTextNode) {
        return new HtmlDomElement(element);
    }
    if (typeof element=="object" && element.type==Cell) {
        return new RvElement(element.lift(wrap));
    }

    throw new Error();
}

}
},{ path:["ui", "jq"], content: function(root, expose) {
expose({
    css: css,
    removeClass: removeClass,
    after: after,
    remove: remove
});

function css(self, property, value) {
    var getComputedStyle = document.defaultView.getComputedStyle;

    if (arguments.length < 3 && typeof property == 'string') {
        return self.style[camelize(property)] || getComputedStyle(self, '').getPropertyValue(property);
    }

    if (!value && value !== 0) {
        self.style.removeProperty(dasherize(property));
        return;
    }

    self.style.cssText += ';' + dasherize(property) + ":" + value;
}

function removeClass(self, name) {
    if (!name) {
        while (self.classList.length > 0) self.classList.remove(self.classList.item(0));
    } else {
        self.classList.remove(name);
    }
}

function after(self, element) {
    self.parentNode.insertBefore(element, self.nextSibling);
}

function remove(self) {
    try {
        self.parentNode.removeChild(self);
    } catch (e) {
        throw e;
    }
}


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

}
},{ path:["ui", "HtmlDomElement"], content: function(root, expose) {
expose(HtmlDomElement);

function HtmlDomElement(element) {
    var jq = root.ui.jq;
    var Container = root.ui.elements.Container;
    var HtmlDom = root.ui.HtmlDom;

    this.bindto = function(preceding) {
        if ("preceding" in this) throw new Error();
        this.preceding = preceding;
        this.view = element.view();
        preceding.place(this.view);

        if (element.children instanceof Array) {
            if (element.children.length!=0) {
                HtmlDom.wrap(element.children).bindto(new Container(this.view));
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

}
},{ path:["ui", "elements", "ListElement"], content: function(root, expose) {
expose(ListElement);

function ListElement(elements) {
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

}
},{ path:["ui", "elements", "RvElement"], content: function(root, expose) {
expose(RvElement);

function RvElement(rv) {
    var Cell = root.reactive.Cell;

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
}

}
},{ path:["ui", "elements", "Container"], content: function(root, expose) {
expose(Container);

function Container(container) {
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
}

}
},{ path:["ui", "HtmlElement"], content: function(root, expose) {
expose(HtmlElement);

function HtmlElement(tag) {
    var jq = root.ui.jq;
    var Cell = root.reactive.Cell;

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
                value.onEvent([], Cell.handler({
                    set: template.set,
                    unset: template.unset
                }));
            } else {
                template.set(value);
            }
        }
    };
}

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
            var jq = root.ui.jq;
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
}
},{ path:["adt", "maybe"], content: function(root, expose) {
expose({
    Some: Some,
    None: None
});

function Some(value) {
    this.value = function() {
        return value;
    };
    this.isEmpty = function() {
        return false;
    };
    this.lift = function(f) {
        return new Some(f(value));
    };
}

function None() {
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

}
},{ path:["reactive", "GC"], content: function(root, expose) {
expose({
    count: count,
    collect: collect,
    printFullDependencies: printFullDependencies
});

var era = 0;

function count() {
    var memory = {}
    for (var i=0;i<arguments.length;i++) {
        if (arguments[i].type != root.reactive.Cell) throw new Error();
        counter(arguments[i]);
    }
    var total = 0;
    for (var i in memory) total+=1;
    return total;

    function counter(rv) {
        memory[rv.id] = rv;
        rv.dependants.map(function(dep) {
            dep.dependants.map(counter)
        });
    }
}

function collect() {
    var used = [];
    for (var i in arguments) {
        markGarbageCollectUsed(arguments[i], used);
    }
    era++;
    for (var i in used) {
        unGarbageAncestors(used[i])
    }
    for (var i in arguments) {
        cutGarbage(arguments[i]);
    }

    function markGarbageCollectUsed(rv, used) {
        rv.era = era;
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
        if (rv.era==era) return;

        rv.isGarbage = false;
        rv.era = era;
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
}

function printFullDependencies(rv) {
    print(collect(rv), "");
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
}

}
},{ path:["reactive", "Cell"], content: function(root, expose) {
expose(Cell);

var maybe = root.adt.maybe;

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

}
}];
    var library = {};
    for (var i in files) {
        initModuleStructure(library, library, files[i].path, files[i].content);
    }
    for (var i in files) {
        addModuleContent(library, library, files[i].path, files[i].content);
    }
    return library;

    function initModuleStructure(library, namespace, path, content) {
        if (path.length==0) throw new Error();
        if (path.length>1) {
            var name = path[0];
            if (!(name in namespace)) {
                namespace[name] = {};
            }
            initModuleStructure(library, namespace[name], path.slice(1), content);
        }
        if (path.length==1) {
            var exposed = null;
            try {
                content(library, function(obj) {
                    exposed = obj;
                    throw new ExposeBreak();
                })
            } catch (e) {
                if (!(e instanceof ExposeBreak)) throw new Error(e);
            }
            if (exposed!=null) {
                if (typeof exposed==="object") {
                    namespace[path[0]] = {};
                }
            }
        }
        function ExposeBreak() {}
    }
    function addModuleContent(library, namespace, path, content) {
        if (path.length>1) {
            addModuleContent(library, namespace[path[0]], path.slice(1), content);
        }
        if (path.length==1) {
            content(library, function(obj) {
                if (typeof obj==="function") {
                    namespace[path[0]] = obj;
                }
                if (typeof obj==="object") {
                    for (var key in obj) {
                        namespace[path[0]][key] = obj[key];
                    }
                }
            });
        }
    }

})();
