define(
[
  "rere/ui/Element", 
  "rere/ui/InputHtml", 
  "rere/ui/InputRadio",
  "rere/ui/InputCheck",
  "rere/ui/InputText",

  "rere/ui/ComboBox", 
  "rere/ui/Option",
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
  "Element", "InputHtml", "InputRadio", "InputCheck", "InputText",
  "ComboBox", "Option", "Text", "jq", "renderer", "StickyButton", "elements", "hacks"
]);

obj.Ul = container("ul");
obj.Li = container("li");
obj.A = container("a");
obj.Section = container("section");
obj.Header = container("header");
obj.Footer = container("footer");
obj.H1 = container("h1");
obj.Strong = container("strong");
obj.Button = container("button");
obj.Div = container("div");
obj.Form = container("form");
obj.Label = container("label");
obj.Span = container("span");

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
