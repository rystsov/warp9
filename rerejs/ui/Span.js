define([], function(){
return function(rere) {

return (function() {
    var Variable = rere.reactive.Variable;
    var span = rere.ui.view.span;

    var self = this;
    this._ui_is = true;
    this._ui_is_span = true;
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
    this.view = span;
});

};
});
