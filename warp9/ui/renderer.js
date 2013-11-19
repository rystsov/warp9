expose({
    h: h,
    parse: parse,
    render: render,
    addTag: addTag
}, function() {
    BaseCell = root.core.cells.BaseCell;
    List = root.core.lists.List;
    BaseList = root.core.lists.BaseList;
    Element = root.ui.ast.Element;
    Component = root.ui.ast.Component;
    Fragment = root.ui.ast.Fragment;
    TextNode = root.ui.ast.TextNode;
    jq = root.ui.jq;
    hacks = root.ui.hacks;
    Matter = root.core.Matter;

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

var Matter, BaseCell, List, BaseList, Element, Component, Fragment, TextNode, jq, hacks;

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
        if (element.metaType==Matter && element.instanceof(BaseCell)) {
            return element.lift(parse);
        }
        if (element.metaType==Matter && element.instanceof(BaseList)) {
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
    } else if (dom.metaType==Matter && dom.instanceof(BaseCell)) {
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
    } else if (element.children.metaType==Matter && element.children.instanceof(BaseList)) {
        var keyDispose = {};
        var stopChildren = function() {
            for (var key in keyDispose) {
                if (!keyDispose.hasOwnProperty(key)) continue;
                keyDispose[key]();
            }
            keyDispose = {};
        };
        var dispose = element.children.onEvent(List.handler({
            reset: function(items) {
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
        element.onDraw.forEach(function(handler) {
            handler(element, html);
        });
        return hacks.once(function() {
            dispose();
            stopChildren();
            jq.remove(html);
            element.dispose();
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
    var dispose = cell.onChange(function(cell){
        if (cell.hasValue()) {
            clean();
            clean = bindDomTo(placeAfterMark, cell.get());
        } else {
            clean();
            clean = function() {};
        }
    });

    // TODO: why hacks.once, is it needed?
    return hacks.once(function() {
        dispose();
        clean();
    });
}

function bindComponentTo(place, component) {
    var dispose = bindDomTo(place, component.value);
    return hacks.once(function() {
        dispose();
        component.dispose();
    });
}