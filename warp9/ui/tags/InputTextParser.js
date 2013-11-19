expose(InputTextParser, function() {
    Matter = root.core.Matter;
    Cell = root.core.cells.Cell;
});

var Matter, Cell;

function InputTextParser(args) {
    args = root.ui.tags.args.parse(args);
    args = root.ui.tags.args.tryIntercept(InputTextParser.TAG, args);

    if (args.children.length != 1) {
        throw new Error();
    }
    if (!(args.children[0].metaType==Matter && args.children[0].instanceof(Cell))) {
        throw new Error();
    }

    var element = new root.ui.ast.Element("input");
    element.events = args.events;
    element.attributes = args.attributes;
    element.onDraw = args.onDraw;
    element.css = args.css;
    element.attributes.type = "text";
    element.attributes.value = args.children[0];

    var input = "input" in element.events ? element.events.input : function(){};
    element.events.input = function(control, view) {
        input.apply(element.events, [control, view]);
        element.attributes.value.set(view.value);
    };

    return element;
}

InputTextParser.TAG = "input-text";