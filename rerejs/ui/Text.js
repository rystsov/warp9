define([], function() {
return function(rere) {

return (function(text) {
    this._ui_is = true;
    this._ui_is_span = true;
    this.text = text;
    this.view = function(element) {
        var FragmentElement = rere.ui.elements.FragmentElement;

        return new FragmentElement(document.createTextNode(this.text));
    };
});

};
});
