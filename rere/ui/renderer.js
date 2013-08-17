expose({
    h: h,
    parse: parse,
    render: render,
    addTag: addTag
}, ctor);

function ctor() {
    addTag("div", root.ui.tags.TagParserFactory("div"));
    addTag("input-text", root.ui.tags.InputTextParser);
}

var tags = {};

function addTag(name, parser) {
    tags[name] = parser;
}

function h(element) { return new root.ui.tags.utils.H(element); }

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
