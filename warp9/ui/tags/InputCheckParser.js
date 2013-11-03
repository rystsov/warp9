expose(InputCheckParser, function(){
    Cell = root.reactive.Cell;
});

var Cell;

function InputCheckParser(type) {
    if (!type) {
        throw new Error("type must be provided");
    }
    if (!(type in {checkbox: 0, radio: 0})) throw new Error("type must be checkbox or radio")
    return function(args) {
        args = root.ui.tags.args.parse(args);

        var element = new root.ui.ast.Element("input");
        element.events = args.events;
        element.attributes = args.attributes;
        element.onDraw = args.onDraw;

        var state;
        if (args.children.length == 0) {
            state = new Cell();
        } else {
            if (args.children.length != 1) throw new Error();
            if (!Cell.instanceof(args.children[0])) throw new Error();
            state = args.children[0];
        }

        element.attributes.type = type;
        element.attributes.checked = state.coalesce(false);


        var isViewOnly = element.attributes["warp9:role"]==="view";
        var change = element.events.change || function(){};

        var changed = element.events["warp9:changed"] || function(){};
        delete element.events["warp9:changed"];
        delete element.attributes["warp9:role"];

        element.events.change = function(control, view) {
            change.apply(element.events, [control, view]);
            changed(view.checked);
            if (!isViewOnly) {
                state.set(view.checked);
            }
        };

        return element;
    };
}
