define(["rere/ui/elements/FragmentElement"], function(FragmentElement) {
    function view(element) {
        var span = $("<span/>");
        if (element.text["rere/reactive/Channel"]) {
            element.text.subscribe(function(value){
                span.text(value);
            });
        } else {
            span.text(element.text);
        }
        return new FragmentElement(span);
    }
    return (function(text) {
        this._ui_is = true;
        this._ui_is_span = true;
        this.text = text;
        this.view = view;
    })
});
