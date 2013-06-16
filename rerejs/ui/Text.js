define(
["rere/ui/elements/FragmentElement", "rere/reactive/Variable"], 
function(FragmentElement, Variable) {

function view(element) {
    var span = document.createElement("span");

    if (element.text["rere/reactive/Channel"]) {
        element.text.onEvent(Variable.handler({
            set: function(e) { setText(span, e); },
            unset: function() { setText(span, null); }
        }));
    } else {
        setText(span, element.text);
    }
    return new FragmentElement(span);
}
return (function(text) {
    this._ui_is = true;
    this._ui_is_span = true;
    this.text = text;
    this.view = view;
});

function setText(span, text) {
    while(span.firstChild) {
        span.removeChild(span.firstChild);
    }
    if (text!=null) {
        span.appendChild(document.createTextNode(text));
    }
}

});
