define(
[
  "rere/ui/Element",

  "rere/ui/jq",
  "rere/ui/renderer",

  "rere/ui/StickyButton", 

  "rere/ui/elements/elements",
  "rere/ui/hacks"],
function() {
var args = arguments;
return function(rere) {

var obj = rere.collect(args, [
  "Element", "jq", "renderer", "StickyButton", "elements", "hacks"
]);

obj.Input = single("input");
obj.Text = function(text) {
    this._ui_is = true;
    this.view = function() {
        var FragmentElement = rere.ui.elements.FragmentElement;
        return new FragmentElement(document.createTextNode(text));
    }
};

return obj;

function single(tag) {
    return function() {
        rere.ui.Element.ctor.apply(this);
        this.view = function(element){
            return rere.ui.Element.renderSingle(element, document.createElement(tag));
        };
    };
}

};
});
