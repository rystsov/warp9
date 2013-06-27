define([], function(){
return function(rere) {

var id = 0;

return (function() {
    this.id = "html_input_" + (id++);
    this._ui_is = true;
    this._ui_is_html_input = true;
    this.data = {
        attributes: {},
        events: {}
    };
    this.attributes = function(attributes) {
        if ("id" in attributes) {
            this.id = attributes.id
        }
        this.data.attributes = attributes
        return this;
    };
    this.events = function(events) {
        this.data.events = events
        return this;
    };
    this.get = function() {
        return this;
    };
    this.view = function(element) {
        return rere.ui.Element.renderSingle(element, document.createElement("input"));
    };
});

};
});
