define([], function() {
return function(rere) {

return (function(element) {
	var FragmentElement = rere.ui.elements.FragmentElement;

    var button = document.createElement("input");
    button.type = "button";
    button.value = element.data.label;
    button.addEventListener("click", function() {
        element.raise();
    }, false);
    return new FragmentElement(button);
});

};
});
