define(
[
  "rere/ui/Button", 
  "rere/ui/ComboBox", 
  "rere/ui/Div", 
  "rere/ui/Input", 
  "rere/ui/Span",
  "rere/ui/StickyButton",
  "rere/ui/Text",
  "rere/ui/jq",
  "rere/ui/renderer",
  "rere/ui/ui",
  "rere/ui/view/view",
  "rere/ui/elements/elements"], 
function() {
var args = arguments;
return function(rere) {

return rere.collect(args, [
  "Button", "ComboBox", "Div", "Input", "Span", "StickyButton", 
  "Text", "jq", "renderer", "ui", "view", "elements"
]);

};
});
