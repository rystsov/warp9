define(
["rere/adt/maybe", "rere/ui/elements/FragmentElement", "rere/reactive/Variable"], 
function(maybe, FragmentElement, Variable) {
    
return (function(element) {
    var input = $("<input type='text'/>");
    if ("class" in element.attributes) {
        var cls = element.attributes["class"];
        
        if (cls["rere/reactive/Channel"]) {
            cls.onEvent(Variable.handler({
                set: function(e) {
                    input.removeClass();
                    input.addClass(e);
                },
                unset: function() {
                    input.removeClass();
                }
            }));
        } else {
            input.addClass(cls);
        };
    }
    element.text.subscribe(function(value){
        if (input.val()!=value) {
            input.val(value);
        }
    });
    input.bind("input", function(){
        element.text.set(input.val());
    });
    return new FragmentElement(input);
});

});
