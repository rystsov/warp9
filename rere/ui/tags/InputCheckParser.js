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
        args = root.ui.tags.utils.parseTagArgs(args);
        var state;
        if (args.children.length == 0) {
            state = new Cell();
        } else {
            if (args.children.length != 1) throw new Error();
            state = args.children[0];
            if (!(typeof state==="object" && state.type==Cell)) throw new Error();
        }

        var element = new root.ui.ast.Element("input");
        var attr = root.ui.tags.utils.normalizeAttributes(args.attr);
        element.events = attr.events;
        element.attributes = attr.attributes;
        element.attributes.type = type;
        element.attributes.checked = state.coalesce(false);

        var isViewOnly = element.attributes["rere:role"]==="view";
        var change = element.events.change || function(){};
        var checked = element.events["rere:checked"] || function(){};
        var unchecked = element.events["rere:unchecked"] || function(){};
        var changed = element.events["rere:changed"] || function(){};
        delete element.events["rere:checked"];
        delete element.events["rere:unchecked"];
        element.events.change = function(control, view) {
            change.apply(element.events, [control, view]);
            if (view.checked) {
                checked();
            } else {
                unchecked();
            }
            changed(view.checked);
            if (!isViewOnly) {
                state.set(view.checked);
            }
        };

        return element;
    };
}
