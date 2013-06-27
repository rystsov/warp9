define(
[
  "rere/ui/Element", 
  "rere/ui/HtmlInput", 
  "rere/ui/RadioInput",
  "rere/ui/CheckInput",
  "rere/ui/Label",

  "rere/ui/ComboBox", 
  "rere/ui/Div", 
  "rere/ui/Span",
  "rere/ui/Text",
  "rere/ui/jq",
  "rere/ui/renderer",

  "rere/ui/Input", 
  "rere/ui/StickyButton", 

  "rere/ui/view/view",
  "rere/ui/elements/elements"], 
function() {
var args = arguments;
return function(rere) {

return rere.collect(args, [
  "Element", "HtmlInput", "RadioInput", "CheckInput", "Label", "ComboBox", "Div", "Span", 
  "Text", "jq", "renderer", "Input", "StickyButton", "view", "elements"
]);

};
});
