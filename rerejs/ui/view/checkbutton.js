define(
["rere/adt/maybe", "rere/ui/elements/FragmentElement", "rere/reactive/Variable"], 
function(maybe, FragmentElement, Variable) {

var id = 0;
return (function(element) {
    var myid = "rere_ui_view_checkbutton_" + (id++);
    var check = $(
        "<input id=\"MYID\" type=\"checkbox\" />".replace(
            "MYID", 
            myid
    ));
    var span = $("<span class=\"uiRereCheckbox\" />");
    span.append(check);
    span.append($(
        "<label for=\"MYID\">TEXT</label>".
            replace("MYID", myid).
            replace("TEXT", element.data.label)
    ));
    element.isset.onEvent(Variable.handler({
        set: function(e) {
            check.prop("checked", e===true);
        },
        unset: function() {
            check.prop("checked", false);
        }
    }));
    check.change(function(){
        element.isset.set(check.prop("checked"));
    });
    return new FragmentElement(span);
});

});
