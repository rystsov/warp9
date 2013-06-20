define([], function() {
return function(rere) {
    
return (function() {
    var Variable = rere.reactive.Variable;
    var combobox = rere.ui.view.combobox;
    
    this._ui_is = true;
    this._ui_is_combobox = true;
    this.value = null;
    this.values = [];
    this._default = null;
    this.default = function(value) {
        if (value["rere/reactive/Variable"]) {
            this.value = value;
        } else if (value["rere/reactive/Channel"]) {
            throw new Error();
        } else {
            this.value = new Variable();
            this.value.set(value);
        }
        return this;
    };
    this.of = function(values) {
        this.values = values;
        return this;
    };
    this.get = function() {
        if (this.value==null) {
            throw new Error();
        }
        return this;
    };
    this.view = combobox;
});

};
});
