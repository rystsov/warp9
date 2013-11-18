expose({
    h: h,
    parse: parse,
    render: render,
    addTag: addTag
}, function() {
    //TODO: TOTNG
    //Cell = root.reactive.Cell;
    //List = root.reactive.List;
    Element = root.ui.ast.Element;
    Component = root.ui.ast.Component;
    Fragment = root.ui.ast.Fragment;
    TextNode = root.ui.ast.TextNode;
    jq = root.ui.jq;
    hacks = root.ui.hacks;
    idgenerator = root.uid;

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

    addTag(root.ui.tags.InputTextParser.TAG, root.ui.tags.InputTextParser);
    addTag(root.ui.tags.InputCheckParser.TAG, root.ui.tags.InputCheckParser("checkbox"));
});

var Cell, List, Element, Component, Fragment, TextNode, jq, hacks, idgenerator;

var tags = {};

function addTag(name, parser) {
    tags[name] = parser;
}

function h(element) { return new root.ui.tags.utils.H(element); }

function parse(element) {
    if (typeof element==="string" || element instanceof String) {
        return new TextNode(element);
    }
    if (typeof element==="number") {
        return new TextNode(element);
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
        if (element.type==root.ui.Component) {
            element = element.builder;
        }
    }
    if (typeof element==="function") {
        var component = new Component();
        component.value = parse(element.apply(component, []));
        return component;
    }
    throw new Error();
}

function render(canvas, element) {
    var placeToCanvas = function(item) {
        canvas.appendChild(item);
    };

    bindDomTo(placeToCanvas, parse(element));
}

function bindDomTo(place, dom) {
    if (dom instanceof Element) {
        return bindElementTo(place, dom);
    } else if (dom instanceof Fragment) {
        return bindElementTo(place, dom);
    } else if (dom instanceof TextNode) {
        return bindElementTo(place, dom);
    } else if (dom instanceof Component) {
        return bindComponentTo(place, dom);
    } else if (typeof dom==="object" && dom.type == Cell) {
        return bindCellTo(place, dom);
    }
    throw new Error();
}

function bindElementTo(place, element) {
    var html = element.view();
    var appendToHtml = function(item) {
        html.appendChild(item);
    };

    place(html);

    if (element.children instanceof Array) {
        var dispose = [];
        element.children.forEach(function(dom){
            dispose.push(bindDomTo(appendToHtml, dom));
        });
        element.onDraw.forEach(function(handler) {
            handler(element, html);
        });
        return hacks.once(function() {
            dispose.forEach(function(f){ f(); });
            jq.remove(html);
            element.dispose();
        });
    } else if (typeof element.children==="object" && element.children.type == List) {
        var keyDispose = {};
        var stopChildren = function() {
            for (var key in keyDispose) {
                if (!keyDispose.hasOwnProperty(key)) continue;
                keyDispose[key]();
            }
            keyDispose = {};
        };
        var unsubscribe = element.children.onEvent(List.handler({
            data: function(items) {
                stopChildren();
                items.forEach(this.add);
            },
            add: function(item) {
                keyDispose[item.key] = bindDomTo(appendToHtml, item.value);
            },
            remove: function(key) {
                if (!(key in keyDispose)) throw new Error();
                keyDispose[key]();
                delete keyDispose[key];
            }
        }));
        var id = idgenerator();
        element.children.leak(id);
        element.onDraw.forEach(function(handler) {
            handler(element, html);
        });
        return hacks.once(function() {
            unsubscribe();
            stopChildren();
            jq.remove(html);
            element.dispose();
            element.children.seal(id);
        });
    }
    throw new Error();
}

function bindCellTo(place, cell) {
    var mark = document.createElement("script");
    var placeAfterMark = function(item) {
        jq.after(mark, item);
    };
    place(mark);

    var clean = function() {};
    var unsubscribe = cell.onEvent(Cell.handler({
        set: function(value) {
            clean();
            clean = bindDomTo(placeAfterMark, value);
        },
        unset: function() {
            clean();
            clean = function() {};
        }
    }));
    var id = idgenerator();
    cell.leak(id);
    // TODO: why hacks.once, is it needed?
    return hacks.once(function() {
        unsubscribe();
        clean();
        cell.seal(id);
    });
}

function bindComponentTo(place, component) {
    var dispose = bindDomTo(place, component.value);
    return hacks.once(function() {
        dispose();
        component.dispose();
    });
}