expose(InputTextParser);

function InputTextParser(args) {
    var Cell = root.reactive.Cell;
    args = root.ui.tags.utils.parseTagArgs(args);
    if (args.children.length != 1) throw new Error();
    var value = args.children[0];
    if (!(typeof value==="object" && value.type==Cell)) throw new Error();

    var element = new root.ui.ast.Element("input");
    var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
    element.events = attr.events;
    element.attributes = attr.attributes;

    element.attributes.type = "text";
    element.attributes.value = value;
    var input = "input" in element.events ? element.events.input : function(){};
    element.events.input = function(control, view) {
        input.apply(element.events, [control, view]);
        value.set(view.value);
    };

    return element;
}
