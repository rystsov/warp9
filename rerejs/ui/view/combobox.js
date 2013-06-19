define([], function() {
return function(rere) {

return (function(element) {
    var FragmentElement = rere.ui.elements.FragmentElement;

    var select = document.createElement("select");
    
    element.values.map(function(e){
        var option = document.createElement("option");
        option.value = e[1];
        option.text = e[0];
        select.appendChild(option)
    })
    element.value.subscribe(function(value){
        select.value = value;
    });
    select.addEventListener("change", function() {
        element.value.set(select.value);
    }, false);
    return new FragmentElement(select);
});

};
});
