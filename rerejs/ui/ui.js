define(
[
  "rere/ui/Element", 
  "rere/ui/InputHtml", 
  "rere/ui/InputRadio",
  "rere/ui/InputCheck",
  "rere/ui/InputText",
  "rere/ui/Label",
  "rere/ui/Form",
  "rere/ui/Button",

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

var obj = rere.collect(args, [
  "Element", "InputHtml", "InputRadio", "InputCheck", "InputText", "Label", "Form", "Button",
  "ComboBox", "Option", "Div", "Span", "Text", "jq", "renderer", "StickyButton", "elements", "hacks"
]);

obj.Ul = function() {
    rere.ui.Element.ctor.apply(this);
    this.view = function(element){
        return rere.ui.Element.renderContainer(element, document.createElement("ul"));
    };
};
obj.Li = function() {
    rere.ui.Element.ctor.apply(this);
    this.view = function(element){
        return rere.ui.Element.renderContainer(element, document.createElement("li"));
    };
}
obj.A = function() {
    rere.ui.Element.ctor.apply(this);
    this.view = function(element){
        return rere.ui.Element.renderContainer(element, document.createElement("a"));
    };
}

return obj;

};
});
