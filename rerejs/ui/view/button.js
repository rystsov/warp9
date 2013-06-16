define(
["rere/ui/elements/FragmentElement"], 
function(FragmentElement) {

return (function(element) {
    var button = document.createElement("input");
    button.type = "button";
    button.value = element.data.label;
    button.addEventListener("click", function() {
        element.raise();
    }, false);
    return new FragmentElement(button);
});

});
