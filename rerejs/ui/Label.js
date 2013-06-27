define([], function(){
return function(rere) {

return (function() {
    this._ui_is = true;
    this._ui_is_label = true;
    this.data = {
        content: {},
        attributes: {},
        events: {}
    };
    this.content = function(content) {
        this.data.content = content;
        return this;
    };
    this.attributes = function(attributes) {
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
        return rere.ui.Element.renderContainer(element, document.createElement("label"));
    };
});

};
});
