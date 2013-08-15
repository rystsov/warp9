define(
[
  "rere/ui/jq",
  "rere/ui/elements/elements",
  "rere/ui/hacks",
  "rere/ui/HtmlDom",
  "rere/ui/HtmlDomElement",
  "rere/ui/HtmlElement",
  "rere/ui/renderer",
  "rere/ui/HtmlTextNode"],
function() {
var args = arguments;
return function(rere) {

var obj = rere.collect(args, [
  "jq", "elements", "hacks", "HtmlDom", "HtmlDomElement", "HtmlElement", "renderer", "HtmlTextNode"
]);

return obj;

};
});
