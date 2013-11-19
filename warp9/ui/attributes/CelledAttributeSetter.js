expose(CelledAttributeSetter, function(){
    AttributeSetter = root.ui.attributes.AttributeSetter;
    Matter = root.core.Matter;
    BaseCell = root.core.cells.BaseCell;
});

var AttributeSetter, Matter, BaseCell;

function CelledAttributeSetter(template) {
    AttributeSetter.apply(this, []);
    this._template = template;
}

CelledAttributeSetter.prototype.apply = function(attribute, element, view, value) {
    if (value.metaType === Matter && value.instanceof(BaseCell)) {
        var self = this;
        var dispose = value.onChange(function(value) {
            if (value.hasValue()) {
                self._template.set(view, value.get());
            } else {
                self._template.unset(view);
            }
        });
        return function() {
            dispose();
        };
    } else {
        this._template.set(view, value);
        return function() {};
    }
};