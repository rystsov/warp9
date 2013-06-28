define([], function(){
return function(rere) {

var id = 0;

return (function() {
    rere.ui.Element.ctor.apply(this);

    this.id = "html_input_" + (id++);
    this._ui_is_html_input = true;

    this.attributes = function(attributes) {
        if ("id" in attributes) {
            this.id = attributes.id
        }
        this.data.attributes = attributes
        return this;
    };

    this.view = function(element) {
        return rere.ui.Element.renderSingle(element, document.createElement("input"));
    };
});

};
});
