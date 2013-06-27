define(
[
  "rere/ui/view/combobox", 
  "rere/ui/view/div", 
  "rere/ui/view/input"
], 
function() {
var args = arguments;
return function(rere) {

return rere.collect(args, [
	"combobox", "div", "input",
]);

};
});
