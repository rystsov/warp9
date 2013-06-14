define(["rere/ui/elements/FragmentElement"], function(FragmentElement) {
    return (function(element) {
        var button = $(
            "<input type='button' value='NAME'/>".replace("NAME", element.data.label)
        );
        element.isset.onEvent(function(e){
            if (e[0]==="set" && e[1]===true) {
                button.css("background-color", "red")
            } else {
                button.css("background-color", "green")
            }
        });
        button.click(function(){
            element.isset.set(true);
        });
        return new FragmentElement(button);
    });
});
