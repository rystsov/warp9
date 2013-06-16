define(
["rere/ui/jq", "rere/adt/maybe", "rere/ui/elements/FragmentElement", "rere/reactive/Variable"], 
function(jq, maybe, FragmentElement, Variable) {
    
return (function(element) {
    var input = document.createElement("input");
    input.type = "text";
    if ("class" in element.attributes) {
        var cls = element.attributes["class"];
        if (cls["rere/reactive/Channel"]) {
            cls.onEvent(Variable.handler({
                set: function(e) {
                    jq.removeClass(input);
                    input.classList.add(e);
                },
                unset: function() {
                    jq.removeClass(input);
                }
            }));
        } else {
            input.classList.add(cls);
        };
    }
    element.text.onEvent(Variable.handler({
        set: function(value) {
            if (input.value!=value) input.value = value;
        },
        unset: function() { 
            if (input.value!="") input.value = "";
        }
    }));

    input.addEventListener("input", function(){
        element.text.set(input.value);
    }, false);
    return new FragmentElement(input);
});

});
