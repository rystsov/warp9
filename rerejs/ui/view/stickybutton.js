define(["rere/ui/elements/FragmentElement"], function(FragmentElement) {
    return (function(element) {
        var button = document.createElement("input");
        button.type = "button";
        button.value = element.data.label;

        element.isset.onEvent(function(e){
            if (e[0]==="set" && e[1]===true) {
                button.style.backgroundColor = "red";
            } else {
                button.style.backgroundColor = "green";
            }
        });
        button.addEventListener("click", function() {
            element.isset.set(true);
        }, false);
        return new FragmentElement(button);
    });
});
