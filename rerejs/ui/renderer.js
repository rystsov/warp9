expose({
    h: h,
    parse: parse,
    render: render
}, ctor);

function ctor() {
    console.info("hello!");
}

var tags = {
    "div": tag("div"),
    "input-text": inputText
};

function h(element) { return new H(element); }

function parse(element) {
    var Cell = root.reactive.Cell;

    if (typeof element==="string" || element instanceof String) {
        return new root.ui.ast.TextNode(element);
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
    var DomContainer = root.ui.dom.DomContainer;

    root.ui.dom.Dom.wrap(parse(element)).bindto(new DomContainer(canvas));
}


function H(element) {
    this.element = element
}

function tag(tagName) {
    return function(args) {
        var args = parseTagArgs(args);
        var element = new root.ui.ast.Element(tagName);
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

    var element = new root.ui.ast.Element("input");
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
