expose({wrap: wrap});

function wrap(element) {
    var Cell = root.reactive.Cell;
    var Element = root.ui.ast.Element;
    var DomElement = root.ui.dom.DomElement;
    var DomArray = root.ui.dom.DomArray;
    var DomList = root.ui.dom.DomList;
    var DomCell = root.ui.dom.DomCell;
    var TextNode = root.ui.ast.TextNode;
    var Fragment = root.ui.ast.Fragment;

    if (element instanceof Array) {
        return new DomArray(element.map(wrap));
    }
    if (typeof element==="object") {
        if (element.type==Element) {
            return new DomElement(element);
        }
        if (element.type==TextNode) {
            return new DomElement(element);
        }
        if (element.type==Fragment) {
            return new DomElement(element);
        }
        if (element.type==Cell) {
            return new DomCell(element.lift(wrap));
        }
        if (element.type==root.reactive.List) {
            return new DomList(element.lift(wrap));
        }
    }


    throw new Error();
}
