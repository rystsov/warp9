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