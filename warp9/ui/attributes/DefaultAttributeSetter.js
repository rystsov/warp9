expose(DefaultAttributeSetter, function(){
    jq = root.ui.jq;
    AttributeSetter = root.ui.attributes.AttributeSetter;
    Cell = root.reactive.Cell;
});

var AttributeSetter, jq, Cell;

function DefaultAttributeSetter() {
    AttributeSetter.apply(this, []);
}

DefaultAttributeSetter.prototype.apply = function(attribute, element, view, value) {
    if (Cell.instanceof(value)) {
        value.leak(element.elementId);
        var dispose = value.onEvent(Cell.handler({
            set: function(value) {
                view.setAttribute(attribute, value);
            },
            unset: function() {
                view.removeAttribute(attribute);
            }
        }));
        return function() {
            dispose();
            value.seal(element.elementId);
        };
    } else {
        view.setAttribute(attribute, value);
        return function() {};
    }
};