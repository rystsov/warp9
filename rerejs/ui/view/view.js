define(
[
  "rere/ui/view/button", 
  "rere/ui/view/checkbutton", 
  "rere/ui/view/combobox", 
  "rere/ui/view/div", 
  "rere/ui/view/input", 
  "rere/ui/view/linkbutton", 
  "rere/ui/view/radiobutton", 
  "rere/ui/view/stickybutton"], 
function() {
var args = arguments;
return function(rere) {

return rere.collect(args, [
	"button", "checkbutton", "combobox", "div", "input", "linkbutton", "radiobutton", "stickybutton"
]);

};
});
