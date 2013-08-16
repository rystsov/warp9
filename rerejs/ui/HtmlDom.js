expose({wrap: wrap});

function wrap(element) {
    var Cell = root.reactive.Cell;
    var HtmlElement = root.ui.HtmlElement;
    var HtmlDomElement = root.ui.HtmlDomElement;
    var ListElement = root.ui.elements.ListElement;
    var RvElement = root.ui.elements.RvElement;
    var HtmlTextNode = root.ui.HtmlTextNode;

    if (element instanceof Array) {
        return new ListElement(element.map(wrap));
    }
    if (typeof element=="object" && element.type==HtmlElement) {
        return new HtmlDomElement(element);
    }
    if (typeof element=="object" && element.type==HtmlTextNode) {
        return new HtmlDomElement(element);
    }
    if (typeof element=="object" && element.type==Cell) {
        return new RvElement(element.lift(wrap));
    }

    throw new Error();
}
