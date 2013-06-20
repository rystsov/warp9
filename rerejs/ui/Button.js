define([], function() {
return function(rere) {

return (function() {
    var button = rere.ui.view.button;

    this._ui_is = true;
    this._ui_is_button = true;
    this.handlers = [];
    this.data = {
        label: "Button1"
    };
    this.subscribe = function(f) {
        this.handlers.push(f);
        return this;
    };
    this.label = function(text) {
        this.data.label = text;
        return this;
    };
    this.get = function() {
        return this;
    };
    this.raise = function() {
        for (var i in this.handlers) {
            this.handlers[i](this);
        }
    };
    this.view = button;
});

};
});
