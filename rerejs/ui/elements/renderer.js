define([], function() {
return function(rere) {

return {
    render : function(element) {
        var renderer = rere.ui.elements.renderer;
        var ListElement = rere.ui.elements.ListElement;
        var RvElement = rere.ui.elements.RvElement;
        var MaybeElement = rere.ui.elements.MaybeElement;
        var ObservableListElement = rere.ui.elements.ObservableListElement;

        var self = this;
        if (element instanceof Array) {
            return new ListElement(element.map(function(e){
                return self.render(e)
            }));
        }

        if (element._ui_is) {
            return element.view(element);
        } else if (element["_m_is_maybe"]) {
            return new MaybeElement(renderer, element)
        } else if (typeof element==="object" && element.type == rere.reactive.Cell) {
            return new RvElement(renderer, element);
        } else if (element["rere/reactive/ObservableList"]) {
            return new ObservableListElement(element.lift(function(e){
                return self.render(e)
            }));
        } else if (typeof(element) == "function") {
            return element(renderer);
        } else {
            throw new Error();
        }
    }
};

};
});
