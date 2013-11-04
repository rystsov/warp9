expose(CelledAttributeSetter, function(){
    AttributeSetter = root.ui.attributes.AttributeSetter;
    Cell = root.reactive.Cell;
});

var AttributeSetter, Cell;

function CelledAttributeSetter(template) {
    AttributeSetter.apply(this, []);
    this._template = template;
}

CelledAttributeSetter.prototype.apply = function(attribute, element, view, value) {
    if (Cell.instanceof(value)) {
        var self = this;
        value.leak(element.elementId);
        var dispose = value.onEvent(Cell.handler({
            set: function(value) {
                self._template.set(view, value);
            },
            unset: function() {
                self._template.unset(view);
            }
        }));
        return function() {
            dispose();
            value.seal(element.elementId);
        };
    } else {
        this._template.set(view, value);
        return function() {};
    }
};