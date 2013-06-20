define([], function(){
return function(rere) {

return (function() {
    var Variable = rere.reactive.Variable;
    var div = rere.ui.view.div;

    var self = this;
    this._ui_is = true;
    this._ui_is_div = true;
    this.visibility = new Variable(true);
    this.data = {
        content: {},
        attributes: {}
    };
    this.with = function(f) {
        f(self);
        return this;
    };
    this.content = function(content) {
        this.data.content = content;
        return this;
    };
    this.attributes = function(attributes) {
        this.data.attributes = attributes
        return this;
    };
    this.get = function() {
        return this;
    };
    this.view = div;
});

};
});
