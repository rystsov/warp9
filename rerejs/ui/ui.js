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

obj.Ul = container("ul");
obj.Li = container("li");
obj.A = container("a");
obj.Section = container("section");
obj.Header = container("header");
obj.Footer = container("footer");
obj.H1 = container("h1");

return obj;

function container(tag) {
    return function() {
        rere.ui.Element.ctor.apply(this);
        this.view = function(element){
            return rere.ui.Element.renderContainer(element, document.createElement(tag));
        };
    };
}

};
});
