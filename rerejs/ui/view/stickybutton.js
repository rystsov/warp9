define(["rere/adt/maybe", "rere/ui/elements/FragmentElement"], function(maybe, FragmentElement) {
    return (function(element) {
        var button = $(
            "<input type='button' value='NAME'/>".replace("NAME", element.data.label)
        );
        element.isset.subscribe(function(value){
            if (value.hasvalue(true)) {
                button.css("background-color", "red")
            } else {
                button.css("background-color", "green")
            }
        })
        button.click(function(){
            element.isset.raise(new maybe.Some(true));
        });
        return new FragmentElement(button);
    });
});
