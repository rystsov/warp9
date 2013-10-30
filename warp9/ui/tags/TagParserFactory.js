expose(TagParserFactory, function(){
    List = root.reactive.List;
});

var List;

function TagParserFactory(tagName) {
    return function(args) {
        args = root.ui.tags.utils.parseTagArgs(args);
        var element = new root.ui.ast.Element(tagName);
        var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
        element.events = attr.events;
        if (element.events.hasOwnProperty("warp9:draw")) {
            element.onDraw.push(element.events["warp9:draw"]);
            delete element.events["warp9:draw"];
        }

        element.attributes = attr.attributes;

        element.children = [];
        var hasCollection = false;
        for (var i in args.children) {
            var child = args.children[i];
            child = root.ui.renderer.parse(child);
            if (typeof child==="object" && child.type == List) {
                hasCollection = true;
            }
            element.children.push(child);
        }
        if (hasCollection) {
            if (element.children.length>1) throw new Error();
            element.children = element.children[0];
        }
        return element;
    };
}