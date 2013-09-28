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
