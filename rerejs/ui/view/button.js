define(["rere/ui/elements/FragmentElement"], function(FragmentElement) {
    return (function(element) {
        var button = $("<input type='button' value='NAME'/>".replace("NAME", element.data.label));
        button.click(function(){
            element.raise();
        });
        return new FragmentElement(button);
    });
});
