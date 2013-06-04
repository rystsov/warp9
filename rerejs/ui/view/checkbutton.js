define(["rere/adt/maybe", "rere/ui/elements/FragmentElement"], function(maybe, FragmentElement) {
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
        element.isset.subscribe(function(value){
            if (value.hasvalue(true)) {
                check.prop("checked", true);
            } else {
                check.prop("checked", false);
            }
        })
        check.change(function(){
            element.isset.raise(new maybe.Some(check.prop("checked")));
        });
        return new FragmentElement(span);
    });
});
