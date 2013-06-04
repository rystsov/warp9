define(
    ["rere/ui/elements/ListElement", "rere/ui/elements/RvElement", "rere/ui/elements/MaybeElement", "rere/ui/elements/ObservableListElement"], 
    function(ListElement, RvElement, MaybeElement, ObservableListElement) {
        var renderer = {
            render : function(element) {
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
                } else if (element["rere/reactive/Channel"]) {
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
        return renderer;
});
