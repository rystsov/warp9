define(["rere/adt/maybe", "rere/ui/elements/FragmentElement"], function(maybe, FragmentElement) {
    return (function(element) {
        var input = $("<input type='text'/>");
        if ("class" in element.attributes) {
            var cls = element.attributes["class"];
            
            if (cls["rere/reactive/Channel"]) {
                cls.subscribe(function(value){
                    input.removeClass();
                    if (value["_m_is_maybe"]) {
                        if (!value.isempty()) {
                            input.addClass(value.value());
                        }
                    } else {
                        input.addClass(value);
                    }
                });
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
