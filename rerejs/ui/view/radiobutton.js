define(
["rere/reactive/Variable", "rere/ui/elements/FragmentElement"], 
function(Variable, FragmentElement) {

var id = 0;
return (function(element) {
    var myid = "rere_ui_view_radiobutton_" + (id++);
    
    var span = document.createElement("span");
    span.classList.add("uiRereRadio");

    var radio = document.createElement("input");
    radio.id = myid;
    radio.type = "radio";
    radio.name = myid;

    var label = document.createElement("label");
    label.htmlFor = myid;
    label.appendChild(document.createTextNode(element.data.label));

    span.appendChild(radio);
    span.appendChild(label);
    
    element.isset.onEvent(Variable.handler({
        set: function(e) {
            radio.checked = (e===true);
        },
        unset: function() {
            radio.checked = false;
        }
    }));
    radio.addEventListener("change", function() {
        element.isset.set(radio.checked);
    }, false);
    return new FragmentElement(span);
});

});
