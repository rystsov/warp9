define(
[
  "rere/ui/Element", 
  "rere/ui/InputHtml", 
  "rere/ui/InputRadio",
  "rere/ui/InputCheck",
  "rere/ui/InputText",
  "rere/ui/Label",
  "rere/ui/Form",

  "rere/ui/ComboBox", 
  "rere/ui/Option", 
  "rere/ui/Div", 
  "rere/ui/Span",
  "rere/ui/Text",
  "rere/ui/jq",
  "rere/ui/renderer",

  "rere/ui/StickyButton", 

  "rere/ui/elements/elements",
  "rere/ui/hacks"],
function() {
var args = arguments;
return function(rere) {

return rere.collect(args, [
  "Element", "InputHtml", "InputRadio", "InputCheck", "InputText", "Label", "Form", "ComboBox",
  "Option", "Div", "Span", "Text", "jq", "renderer", "StickyButton", "elements", "hacks"
]);

};
});
