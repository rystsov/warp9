expose(TagParserFactory, function(){
    Matter = root.core.Matter;
    BaseList = root.core.lists.BaseList;
});

var Matter, BaseList;

function TagParserFactory(tagName) {
    return function(args) {
        args = root.ui.tags.args.parse(args);
        args = root.ui.tags.args.tryIntercept(tagName, args);

        var element = new root.ui.ast.Element(tagName);
        element.events = args.events;
        element.attributes = args.attributes;
        element.onDraw = args.onDraw;
        element.css = args.css;

        if (args.children.length==1) {
            element.children = [root.ui.renderer.parse(args.children[0])];
            if (element.children[0].metaType==Matter && element.children[0].instanceof(BaseList)) {
                element.children = element.children[0]
            }
        } else {
            element.children = args.children.map(function(child) {
                child = root.ui.renderer.parse(child);
                if (child.metaType==Matter && child.instanceof(BaseList)) {
                    throw new Error();
                }
                return child;
            });
        }

        return element;
    };
}