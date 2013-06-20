define([], function(){
return function(rere) {

return (function() {
    var Variable = rere.reactive.Variable;
    var input = rere.ui.view.input;

    var self = this;
    this._ui_is = true;
    this._ui_is_input = true;
    this.text = null;
    this.attributes = {};
    this.attributes = function(attributes) {
        this.attributes = attributes;
        return this;
    };
    this.default = function(value) {
        if (value["rere/reactive/Channel"]) {
            this.text = value;
        } else {
            this.text = new Variable();
            this.text.set(value);
        }
        return this;
    };
    this.get = function() {
        if (this.text==null) {
            this.text = new Variable();
            this.text.set("");
        }
        return this;
    };
    this.view = input;
});

};
});
