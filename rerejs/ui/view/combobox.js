define(["rere/ui/elements/FragmentElement"], function(FragmentElement) {
    return (function(element) {
        var select = $("<select/>");
        element.values.map(function(e){
        	var option = $("<option/>");
        	option.attr("value", e[1]);
        	option.text(e[0]);
        	select.append(option)
        })
        element.value.subscribe(function(value){
            select.val(value);
        });
        select.bind("change", function(){ 
            element.value.set(select.val());
        });
        return new FragmentElement(select);
    });
});
