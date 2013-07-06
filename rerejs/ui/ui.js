define(
[
  "rere/ui/Element",
  "rere/ui/InputRadio",
  "rere/ui/InputCheck",
  "rere/ui/InputText",

  "rere/ui/ComboBox",
  "rere/ui/jq",
  "rere/ui/renderer",

  "rere/ui/StickyButton", 

  "rere/ui/elements/elements",
  "rere/ui/hacks"],
function() {
var args = arguments;
return function(rere) {

var obj = rere.collect(args, [
  "Element", "InputRadio", "InputCheck", "InputText",
  "ComboBox", "jq", "renderer", "StickyButton", "elements", "hacks"
]);

obj.Input = single("input");

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
