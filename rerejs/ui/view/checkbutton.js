define([], function() {
return function(rere) {

var id = 0;
return (function(element) {
    var FragmentElement = rere.ui.elements.FragmentElement;
    var Variable = rere.reactive.Variable;

    var myid = "rere_ui_view_checkbutton_" + (id++);
    
    var span = document.createElement("span");
    span.class = "uiRereCheckbox";

    var check = document.createElement("input");
    check.id = myid;
    check.type = "checkbox";

    var label = document.createElement("label");
    label.htmlFor = myid;
    label.appendChild(document.createTextNode(element.data.label));

    span.appendChild(check);
    span.appendChild(label);
    
    element.isset.onEvent(Variable.handler({
        set: function(e) {
            check.checked = (e===true);
        },
        unset: function() {
            check.checked = false;
        }
    }));
    check.addEventListener("change", function() {
        element.isset.set(check.checked);
    }, false);
    return new FragmentElement(span);
});

};
});
