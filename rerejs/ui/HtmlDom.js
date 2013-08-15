define([], function() {
return function(rere) {

return {
    wrap : function(element) {
        var Cell = rere.reactive.Cell;
        var HtmlElement = rere.ui.HtmlElement;
        var HtmlDomElement = rere.ui.HtmlDomElement;
        var ListElement = rere.ui.elements.ListElement;
        var RvElement = rere.ui.elements.RvElement;
        var HtmlTextNode = rere.ui.HtmlTextNode;

        if (element instanceof Array) {
            return new ListElement(element.map(rere.ui.HtmlDom.wrap));
        }
        if (typeof element=="object" && element.type==HtmlElement) {
            return new HtmlDomElement(element);
        }
        if (typeof element=="object" && element.type==HtmlTextNode) {
            return new HtmlDomElement(element);
        }
        if (typeof element=="object" && element.type==Cell) {
            return new RvElement(element.lift(rere.ui.HtmlDom.wrap));
        }

        throw new Error();
    }
};

};
});
