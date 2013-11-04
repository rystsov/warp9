expose(InputTextParser, function() {
    Cell = root.reactive.Cell;
});

var Cell;

function InputTextParser(args) {
    args = root.ui.tags.args.parse(args);
    args = root.ui.tags.args.tryIntercept(InputTextParser.TAG, args);

    if (args.children.length != 1) {
        throw new Error();
    }
    if (!Cell.instanceof(args.children[0])) {
        throw new Error();
    }

    var element = new root.ui.ast.Element("input");
    element.events = args.events;
    element.attributes = args.attributes;
    element.onDraw = args.onDraw;
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