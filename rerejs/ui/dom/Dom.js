expose({wrap: wrap});

function wrap(element) {
    var Cell = root.reactive.Cell;
    var HtmlElement = root.ui.HtmlElement;
    var DomElement = root.ui.dom.DomElement;
    var DomList = root.ui.dom.DomList;
    var DomCell = root.ui.dom.DomCell;
    var HtmlTextNode = root.ui.HtmlTextNode;

    if (element instanceof Array) {
        return new DomList(element.map(wrap));
    }
    if (typeof element=="object" && element.type==HtmlElement) {
        return new DomElement(element);
    }
    if (typeof element=="object" && element.type==HtmlTextNode) {
        return new DomElement(element);
    }
    if (typeof element=="object" && element.type==Cell) {
        return new DomCell(element.lift(wrap));
    }

    throw new Error();
}
