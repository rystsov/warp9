expose(DefaultAttributeSetter, function(){
    jq = root.ui.jq;
    AttributeSetter = root.ui.attributes.AttributeSetter;
    Matter = root.core.Matter;
    BaseCell = root.core.cells.BaseCell;
});

var AttributeSetter, jq, Matter, BaseCell;

function DefaultAttributeSetter() {
    AttributeSetter.apply(this, []);
}

DefaultAttributeSetter.prototype.apply = function(attribute, element, view, value) {
    if (value.metaType === Matter && value.instanceof(BaseCell)) {
        value.leak(element.elementId);
        var dispose = value.onChange(function(value) {
            if (value.hasValue()) {
                view.setAttribute(attribute, value.get());
            } else {
                view.removeAttribute(attribute);
            }
        });
        return function() {
            dispose();
            value.seal(element.elementId);
        };
    } else {
        view.setAttribute(attribute, value);
        return function() {};
    }
};