var rere = (function(){
    var files = [
        {
            path: ["utils"],
            content: function(root, expose) {
                expose({
                    hashLen: hashLen,
                    hashValues: hashValues
                });
                
                function hashLen(hash) {
                    var count = 0;
                    for (var i in hash) {
                        if (!hash.hasOwnProperty(i)) continue;
                        count++;
                    }
                    return count;
                }
                
                function hashValues(hash) {
                    var values = [];
                    for (var i in hash) {
                        if (!hash.hasOwnProperty(i)) continue;
                        values.push(hash[i]);
                    }
                    return values;
                }
            }
        },
        {
            path: ["ui", "ast", "Element"],
            content: function(root, expose) {
                expose(Element);
                
                var id = 0;
                
                function Element(tag) {
                    var jq = root.ui.jq;
                    var Cell = root.reactive.Cell;
                
                    this.type = Element;
                    this.tag = tag;
                    this.attributes = {};
                    this.events = {};
                    this.children = [];
                    this.elementId = "rere/ui/ast/element/" + (id++);
                
                    this.attributeSetters = defaultAttributeSetters();
                
                    this.disposes = [];
                    this.cells = {};
                    this.dispose = function() {
                        this.disposes.forEach(function(x) { x(); });
                        for (var i in this.cells) {
                            if (!this.cells.hasOwnProperty(i)) continue;
                            this.cells[i].removeUser(this.elementId);
                        }
                
                        this.dispose = function() { throw new Error(); }
                    };
                    this.view = function() {
                        var view = document.createElement(tag);
                
                        for (var name in this.attributes) {
                            if (!this.attributes.hasOwnProperty(name)) continue;
                            if (name=="css") continue;
                            this.setAttribute(view, name, this.attributes[name])
                        }
                
                        for (var name in this.events) {
                            if (!this.events.hasOwnProperty(name)) continue;
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
                                if (!this.attributes["css"].hasOwnProperty(property)) continue;
                                if (property.indexOf("rere:")==0) continue;
                                (function(property, value){
                                    if (typeof value==="object" && value.type == Cell) {
                                        this.cells[value.id] = value;
                                        this.disposes.push(value.onEvent([], Cell.handler({
                                            set: function(e) { jq.css(view, property, e); },
                                            unset: function() { jq.css(view, property, null); }
                                        })));
                                    } else {
                                        jq.css(view, property, value);
                                    }
                                }.bind(this))(property, this.attributes["css"][property]);
                            }
                        }
                
                        for (var i in this.cells) {
                            if (!this.cells.hasOwnProperty(i)) continue;
                            this.cells[i].addUser(this.elementId);
                        }
                
                        this.view = function() {
                            throw new Error();
                        };
                
                        return view;
                    };
                    this.setAttribute = function(view, name, value) {
                        var self = this;
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
                                self.cells[value.id] = value;
                                self.disposes.push(value.onEvent([], Cell.handler({
                                    set: template.set,
                                    unset: template.unset
                                })));
                            } else {
                                template.set(value);
                            }
                        }
                    };
                }
                
                function defaultAttributeSetters() {
                    return {
                        checked: function(view) {
                            return {
                                set: function(v) {
                                    view.checked = v;
                                },
                                unset: function() {
                                    view.checked = false;
                                }
                            };
                        },
                        value: function(view) {
                            return {
                                set: function(v) {
                                    if (view.value!=v) view.value = v;
                                },
                                unset: function() {
                                    if (view.value!="") view.value = "";
                                }
                            };
                        },
                        disabled: function(view) {
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
                        "class": function(view) {
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
        },
        {
            path: ["ui", "ast", "TextNode"],
            content: function(root, expose) {
                expose(TextNode);
                
                function TextNode(text) {
                    this.type = TextNode;
                    this.dispose = function() {};
                    this.children = [];
                    this.events = {};
                    this.cells = {};
                    this.view = function() {
                        var view = document.createTextNode(text);
                
                        this.view = function() {
                            throw new Error();
                        };
                
                        return view;
                    };
                }
            }
        },
        {
            path: ["ui", "ast", "Fragment"],
            content: function(root, expose) {
                expose(Fragment);
                
                function Fragment(html) {
                    this.type = Fragment;
                    this.dispose = function() {};
                    this.children = [];
                    this.events = {};
                    this.cells = {};
                    this.view = function() {
                        this.view = function() {
                            throw new Error();
                        };
                
                        return html;
                    };
                }
            }
        },
        {
            path: ["ui", "dom", "Dom"],
            content: function(root, expose) {
                expose({wrap: wrap});
                
                function wrap(element) {
                    var Cell = root.reactive.Cell;
                    var Element = root.ui.ast.Element;
                    var DomElement = root.ui.dom.DomElement;
                    var DomArray = root.ui.dom.DomArray;
                    var DomList = root.ui.dom.DomList;
                    var DomCell = root.ui.dom.DomCell;
                    var TextNode = root.ui.ast.TextNode;
                    var Fragment = root.ui.ast.Fragment;
                
                    if (element instanceof Array) {
                        return new DomArray(element.map(wrap));
                    }
                    if (typeof element==="object") {
                        if (element.type==Element) {
                            return new DomElement(element);
                        }
                        if (element.type==TextNode) {
                            return new DomElement(element);
                        }
                        if (element.type==Fragment) {
                            return new DomElement(element);
                        }
                        if (element.type==Cell) {
                            return new DomCell(element.lift(wrap));
                        }
                        if (element.type==root.reactive.List) {
                            return new DomList(element.lift(wrap));
                        }
                    }
                
                
                    throw new Error();
                }
                
            }
        },
        {
            path: ["ui", "dom", "DomList"],
            content: function(root, expose) {
                expose(DomList);
                
                function DomList(list) {
                    var Fragment = root.ui.ast.Fragment;
                    var Dom = root.ui.dom.Dom;
                
                    this.last = Dom.wrap(new Fragment(document.createElement("script")));
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
                }
                
            }
        },
        {
            path: ["ui", "dom", "DomArray"],
            content: function(root, expose) {
                expose(DomArray);
                
                function DomArray(elements) {
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
        },
        {
            path: ["ui", "dom", "DomElement"],
            content: function(root, expose) {
                expose(DomElement);
                
                var id = 0;
                
                function DomElement(element) {
                    var jq = root.ui.jq;
                    var DomContainer = root.ui.dom.DomContainer;
                    var Dom = root.ui.dom.Dom;
                
                    this.elementId = "rere/ui/dom/element/" + (id++);
                
                    this.bindto = function(preceding) {
                        if ("preceding" in this) throw new Error();
                        this.preceding = preceding;
                        this.view = element.view();
                        preceding.place(this.view);
                        if (root.utils.hashLen(element.cells)>0) {
                            root.ui.GC.trackCellsBlock({
                                id: this.elementId,
                                cells: element.cells
                            });
                        }
                
                        if (element.children instanceof Array) {
                            if (element.children.length!=0) {
                                Dom.wrap(element.children).bindto(new DomContainer(this.view));
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
                        root.ui.GC.forgetCellsBlock({
                            id: this.elementId
                        });
                        this.place = function(follower) { this.preceding.place(follower); };
                        this.remove = function() { throw new Error(); }
                    };
                }
                
            }
        },
        {
            path: ["ui", "dom", "DomContainer"],
            content: function(root, expose) {
                expose(DomContainer);
                
                function DomContainer(container) {
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
        },
        {
            path: ["ui", "dom", "DomCell"],
            content: function(root, expose) {
                expose(DomCell);
                
                var id = 0;
                
                function DomCell(rv) {
                    var Cell = root.reactive.Cell;
                
                    this.last = null;
                    this.head = null;
                    this.cellId = "rere/ui/dom/cell/" + (id++);
                    this.dispose = function() {};
                    this.bindto = function(element) {
                        var self = this;
                
                        this.head = element;
                        rv.addUser(this.cellId);
                        this.dispose = rv.onEvent([], Cell.handler({
                            set: function(e) {
                                if (self.last!=null) {
                                    self.last.remove();
                                }
                                self.last = e;
                                self.last.bindto(element);
                            },
                            unset: function() {
                                if (self.last!=null) {
                                    self.last.remove();
                                    self.last = null;
                                }
                            }
                        }));
                        var block = {
                            id: this.cellId,
                            cells: {}
                        };
                        block.cells[rv.id] = rv;
                        root.ui.GC.trackCellsBlock(block);
                    };
                    this.place = function(html) {
                        if (this.last==null) {
                            this.head.place(html);
                        } else {
                            this.last.place(html);
                        }
                    };
                    this.remove = function() {
                        this.dispose();
                        root.ui.GC.forgetCellsBlock({ id: this.cellId });
                        rv.removeUser(this.cellId);
                        if (this.last!=null) {
                            this.last.remove();
                            this.last = null;
                        }
                    };
                }
                
            }
        },
        {
            path: ["ui", "renderer"],
            content: function(root, expose) {
                expose({
                    h: h,
                    parse: parse,
                    render: render,
                    addTag: addTag
                }, ctor);
                
                function ctor() {
                    addTag("div", root.ui.tags.TagParserFactory("div"));
                    addTag("a", root.ui.tags.TagParserFactory("a"));
                    addTag("section", root.ui.tags.TagParserFactory("section"));
                    addTag("header", root.ui.tags.TagParserFactory("header"));
                    addTag("footer", root.ui.tags.TagParserFactory("footer"));
                    addTag("span", root.ui.tags.TagParserFactory("span"));
                    addTag("strong", root.ui.tags.TagParserFactory("strong"));
                    addTag("h1", root.ui.tags.TagParserFactory("h1"));
                    addTag("ul", root.ui.tags.TagParserFactory("ul"));
                    addTag("li", root.ui.tags.TagParserFactory("li"));
                    addTag("label", root.ui.tags.TagParserFactory("label"));
                    addTag("button", root.ui.tags.TagParserFactory("button"));
                
                    addTag("input-text", root.ui.tags.InputTextParser);
                    addTag("input-check", root.ui.tags.InputCheckParser("checkbox"));
                }
                
                var tags = {};
                
                function addTag(name, parser) {
                    tags[name] = parser;
                }
                
                function h(element) { return new root.ui.tags.utils.H(element); }
                
                function parse(element) {
                    var Cell = root.reactive.Cell;
                    var List = root.reactive.List;
                
                    if (typeof element==="string" || element instanceof String) {
                        return new root.ui.ast.TextNode(element);
                    }
                    if (typeof element==="number") {
                        return new root.ui.ast.TextNode(element);
                    }
                    if (element instanceof Array) {
                        if (element.length==0) throw new Error();
                        var tag = element[0];
                        if (!(tag in tags)) throw new Error("Unknown tag: " + tag);
                        return tags[tag](element.slice(1));
                    }
                    if (typeof element==="object") {
                        if (element.type==Cell) {
                            return element.lift(parse);
                        }
                        if (element.type==List) {
                            return element.lift(parse);
                        }
                    }
                
                    throw new Error();
                }
                
                function render(canvas, element) {
                    var DomContainer = root.ui.dom.DomContainer;
                
                    root.ui.dom.Dom.wrap(parse(element)).bindto(new DomContainer(canvas));
                }
                
            }
        },
        {
            path: ["ui", "GC"],
            content: function(root, expose) {
                expose({
                    trackCellsBlock: trackCellsBlock,
                    forgetCellsBlock: forgetCellsBlock,
                    info: info,
                    collect: collect,
                    count: count
                });
                
                var blocks = {}
                
                function collect() {
                    root.reactive.GC.collect.apply(root.reactive.GC, cellRoots());
                }
                
                function count() {
                    return root.reactive.GC.count.apply(root.reactive.GC, cellRoots());
                }
                
                function trackCellsBlock(block) {
                    blocks[block.id] = block.cells;
                }
                
                function forgetCellsBlock(block) {
                    delete blocks[block.id];
                }
                
                function info() {
                    return {blocks: len(blocks) };
                    function len(hash) {
                        var count = 0;
                        for (var i in hash) {
                            if (!hash.hasOwnProperty(i)) continue;
                            count++;
                        }
                        return count;
                    }
                }
                
                function cellRoots() {
                    var era = new Object();
                
                    var roots = {};
                    for (var i in blocks) {
                        if (!blocks.hasOwnProperty(i)) continue;
                        for (var j in blocks[i]) {
                            if (!blocks[i].hasOwnProperty(j)) continue;
                            findRoot(blocks[i][j], roots);
                        }
                    }
                
                    return root.utils.hashValues(roots);
                
                    function findRoot(cell, roots) {
                        if (cell.era===era) return;
                        cell.era = era;
                        if (cell.dependanties.length==0) {
                            roots[cell.id] = cell;
                        } else {
                            cell.dependanties.forEach(function(item){ findRoot(item, roots); });
                        }
                    }
                }
            }
        },
        {
            path: ["ui", "hacks"],
            content: function(root, expose) {
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
        },
        {
            path: ["ui", "jq"],
            content: function(root, expose) {
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
        },
        {
            path: ["ui", "tags", "utils"],
            content: function(root, expose) {
                expose({
                    parseTagArgs: parseTagArgs,
                    normalizeAttributes: normalizeAttributes,
                    denormalizeAttributes: denormalizeAttributes,
                    tryEnrich: tryEnrich,
                    H: H
                });
                
                function H(element) {
                    this.element = element
                }
                
                function parseTagArgs(args) {
                    var Cell = root.reactive.Cell;
                    var List = root.reactive.List;
                    if (args.length==0) throw new Error();
                
                    var children = [args[0]];
                    var attr = null;
                
                    while(true) {
                        if (typeof args[0]==="string") break;
                        if (args[0] instanceof Array) break;
                        if (args[0] instanceof Object && args[0].type==Cell) break;
                        if (args[0] instanceof Object && args[0].type==List) break;
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
                
                function tryEnrich(target, supplement) {
                    if (!supplement) return;
                    for(var key in supplement) {
                        if (!supplement.hasOwnProperty(key)) continue;
                        if (key in target) {
                            if (typeof target[key]==="object") {
                                if (typeof supplement[key]!=="object") {
                                    throw new Error();
                                }
                                tryEnrich(target[key], supplement[key]);
                            } else {
                                continue;
                            }
                        }
                        target[key] = supplement[key];
                    }
                }
                
                function normalizeAttributes(attr) {
                    var element = {
                        events: {},
                        attributes: {}
                    };
                    if (attr!=null) {
                        for (var name in attr) {
                            if (!attr.hasOwnProperty(name)) continue;
                
                            if (typeof attr[name]==="function" && name[0]==="!") {
                                element.events[name.substring(1)] = attr[name];
                                continue;
                            }
                            if (name.indexOf("css/")===0) {
                                if (!element.attributes.css) {
                                    element.attributes.css = {};
                                }
                                element.attributes.css[name.substring(4)] = attr[name];
                                continue;
                            }
                            if (name==="css") {
                                if (!element.attributes.css) {
                                    element.attributes.css = {};
                                }
                                for (var key in attr[name]) {
                                    if (!attr[name].hasOwnProperty(key)) continue;
                                    element.attributes.css[key] = attr[name][key];
                                }
                            }
                            element.attributes[name] = attr[name];
                        }
                    }
                    return element;
                }
                
                function denormalizeAttributes(attr) {
                    var result = {};
                    for (var attrKey in attr.attributes) {
                        if (!attr.attributes.hasOwnProperty(attrKey)) continue;
                        result[attrKey] = attr.attributes[attrKey];
                    }
                    for (var eventKey in attr.events) {
                        if (!attr.events.hasOwnProperty(eventKey)) continue;
                        result["!"+eventKey] = attr.events[eventKey];
                    }
                    return result;
                }
            }
        },
        {
            path: ["ui", "tags", "InputCheckParser"],
            content: function(root, expose) {
                expose(InputCheckParser, function(){
                    Cell = root.reactive.Cell;
                });
                
                var Cell;
                
                function InputCheckParser(type) {
                    if (!type) {
                        throw new Error("type must be provided");
                    }
                    if (!(type in {checkbox: 0, radio: 0})) throw new Error("type must be checkbox or radio")
                    return function(args) {
                        args = root.ui.tags.utils.parseTagArgs(args);
                        var state;
                        if (args.children.length == 0) {
                            state = new Cell();
                        } else {
                            if (args.children.length != 1) throw new Error();
                            state = args.children[0];
                            if (!(typeof state==="object" && state.type==Cell)) throw new Error();
                        }
                
                        var element = new root.ui.ast.Element("input");
                        var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
                        element.events = attr.events;
                        element.attributes = attr.attributes;
                        element.attributes.type = type;
                        element.attributes.checked = state.coalesce(false);
                
                        var isViewOnly = element.attributes["rere:role"]==="view";
                        var change = element.events.change || function(){};
                        var checked = element.events["rere:checked"] || function(){};
                        var unchecked = element.events["rere:unchecked"] || function(){};
                        var changed = element.events["rere:changed"] || function(){};
                        delete element.events["rere:checked"];
                        delete element.events["rere:unchecked"];
                        element.events.change = function(control, view) {
                            change.apply(element.events, [control, view]);
                            if (view.checked) {
                                checked();
                            } else {
                                unchecked();
                            }
                            changed(view.checked);
                            if (!isViewOnly) {
                                state.set(view.checked);
                            }
                        };
                
                        return element;
                    };
                }
                
            }
        },
        {
            path: ["ui", "tags", "InputTextParser"],
            content: function(root, expose) {
                expose(InputTextParser);
                
                function InputTextParser(args) {
                    var Cell = root.reactive.Cell;
                    args = root.ui.tags.utils.parseTagArgs(args);
                    if (args.children.length != 1) throw new Error();
                    var value = args.children[0];
                    if (!(typeof value==="object" && value.type==Cell)) throw new Error();
                
                    var element = new root.ui.ast.Element("input");
                    var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
                    element.events = attr.events;
                    element.attributes = attr.attributes;
                
                    element.attributes.type = "text";
                    element.attributes.value = value;
                    var input = "input" in element.events ? element.events.input : function(){};
                    element.events.input = function(control, view) {
                        input.apply(element.events, [control, view]);
                        value.set(view.value);
                    };
                
                    return element;
                }
                
            }
        },
        {
            path: ["ui", "tags", "TagParserFactory"],
            content: function(root, expose) {
                expose(TagParserFactory);
                
                function TagParserFactory(tagName) {
                    return function(args) {
                        var args = root.ui.tags.utils.parseTagArgs(args);
                        var element = new root.ui.ast.Element(tagName);
                        var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
                        element.events = attr.events;
                        element.attributes = attr.attributes;
                        element.children = [];
                        for (var i in args.children) {
                            var child = args.children[i];
                            child = root.ui.renderer.parse(child);
                            element.children.push(child);
                        }
                        return element;
                    };
                }
            }
        },
        {
            path: ["reactive", "GC"],
            content: function(root, expose) {
                expose({
                    count: count,
                    collect: collect,
                    printFullDependencies: printFullDependencies
                });
                
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
                    var era = new Object();
                    var used = [];
                    for (var i in arguments) {
                        markGarbageCollectUsed(arguments[i], used);
                    }
                    era = new Object();
                    for (var i in used) {
                        unGarbageAncestors(used[i])
                    }
                    for (var i in arguments) {
                        cutGarbage(arguments[i]);
                    }
                
                    function markGarbageCollectUsed(rv, used) {
                        rv.era = era;
                        rv.isGarbage = true;
                        if (rv.hasUsers()) {
                            used.push(rv);
                        }
                        for (var i in rv.dependants) {
                            for (var j in rv.dependants[i].dependants) {
                                markGarbageCollectUsed(rv.dependants[i].dependants[j], used);
                            }
                        }
                    }
                    function unGarbageAncestors(rv) {
                        if (rv.era===era) return;
                
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
                            result.dependants.push(collect(dependants[i]));
                        }
                        return result;
                    }
                    function print(info, offset) {
                        console.info(offset + info.name + (info.dependants.length==0 ? "" : ":"));
                        info.dependants.map(function(x) { print(x, offset + "  "); })
                    }
                }
                
            }
        },
        {
            path: ["reactive", "List"],
            content: function(root, expose) {
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
                
                    this.count = function() {
                        if (arguments.length===0) return count;
                
                        var f = arguments[0];
                        var matches = new Cell(0);
                        var subscribes = {};
                
                        this.subscribe(List.handler({
                            data: function(e) {
                                var matched = 0;
                                for (var i=0;i < e.length;i++) {
                                    if (add(e[i].key, e[i].value)) matched++;
                                }
                                if (matched>0) {
                                    matches.set(matches.unwrap()+matched);
                                }
                            },
                            add: function(e) {
                                add(e.key, e.value);
                            },
                            remove: function(e) {
                                if (e in subscribes) {
                                    subscribes[e]();
                                    delete subscribes[e];
                                }
                            }
                        }));
                
                        return matches;
                
                        function add(key, item) {
                            var mark = f(item);
                            if (typeof mark === "boolean") {
                                return mark;
                            } else if (typeof mark === "object" && mark.type === Cell) {
                                var isSet = false;
                                var unsubscribe = mark.onEvent([matches], Cell.handler({
                                    "set": function(value) {
                                        if (value == isSet) return;
                                        matches.set(matches.unwrap()+(isSet ? -1: 1));
                                        isSet = value;
                                    },
                                    "unset": function() {
                                        if (isSet) {
                                            matches.set(matches.unwrap()-1);
                                            isSet = false;
                                        }
                                    }
                                }));
                                subscribes[key] = function() {
                                    if (isSet) {
                                        matches.set(matches.unwrap()-1);
                                    }
                                    unsubscribe();
                                }
                            } else {
                                throw new Error();
                            }
                            return false;
                        }
                    };
                
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
            }
        },
        {
            path: ["reactive", "Cell"],
            content: function(root, expose) {
                expose(Cell);
                
                var maybe = root.adt.maybe;
                
                var id = 0;
                
                function Cell() {
                    var dependantsId = 0;
                
                    this.id = id++;
                
                    // used in garbage collection
                    this.era = new Object();
                    this.isActive = true;
                    this.users = [];
                    this.addUser = function(userId) {
                        if (this.users.indexOf(userId)>=0) throw new Error();
                        this.users.push(userId);
                    };
                    this.hasUsers = function() {
                        return this.users.length>0;
                    };
                    this.hasUser = function(userId) {
                        return this.users.indexOf(userId)>=0;
                    };
                    this.removeUser = function(userId) {
                        if (this.users.indexOf(userId)<0) throw new Error();
                        this.users = this.users.filter(function(item){ return item != userId });
                        if (this.users.indexOf(userId)>=0) throw new Error();
                    };
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
                
                Cell.prototype.when = function(condition, value) {
                    var self = this;
                
                    var test = typeof condition === "function" ? condition : function(value) {
                        return value === condition;
                    };
                
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
                            if (e[0]==="set") {
                                if (test(e[1])) {
                                    channel.set(value);
                                } else {
                                    channel.unset();
                                }
                            } else if (e[0]==="unset") {
                                channel.unset();
                            } else {
                                throw new Error();
                            }
                        }, forget);
                    };
                    channel.activate();
                
                    return channel;
                };
                
                Cell.prototype.coalesce = function(value) {
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
                            if (e[0]==="set") {
                                channel.set(e[1]);
                            } else if (e[0]==="unset") {
                                channel.set(value);
                            } else {
                                throw new Error();
                            }
                        }, forget);
                    };
                    channel.activate();
                
                    return channel;
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
        },
        {
            path: ["adt", "maybe"],
            content: function(root, expose) {
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
        }
    ];    var library = {};
    for (var i in files) {
        initModuleStructure(library, library, files[i].path, files[i].content);
    }
    var ctors = [];
    for (var i in files) {
        addModuleContentCollectCtor(library, library, files[i].path, files[i].content, ctors);
    }
    ctors.forEach(function(x){ x(); });
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
                content(library, function(obj, ctor) {
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
    function addModuleContentCollectCtor(library, namespace, path, content, ctors) {
        if (path.length>1) {
            addModuleContentCollectCtor(library, namespace[path[0]], path.slice(1), content, ctors);
        }
        if (path.length==1) {
            content(library, function(obj, ctor) {
                if (ctor) ctors.push(ctor);
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