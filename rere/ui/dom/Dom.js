expose({wrap: wrap});

function wrap(element) {
    var Cell = root.reactive.Cell;
    var Element = root.ui.ast.Element;
    var DomElement = root.ui.dom.DomElement;
    var DomList = root.ui.dom.DomList;
    var DomCell = root.ui.dom.DomCell;
    var TextNode = root.ui.ast.TextNode;

    if (element instanceof Array) {
        return new DomList(element.map(wrap));
    }
    if (typeof element=="object" && element.type==Element) {
        return new DomElement(element);
    }
    if (typeof element=="object" && element.type==TextNode) {
        return new DomElement(element);
    }
    if (typeof element=="object" && element.type==Cell) {
        return new DomCell(element.lift(wrap));
    }

    throw new Error();
}
