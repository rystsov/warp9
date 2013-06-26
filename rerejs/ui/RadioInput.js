define([], function(){
return function(rere) {

var id = 0;


return (function(state) {
    rere.ui.HtmlInput.apply(this, []);

    this.get = function() {
        this.data.attributes.type="radio";
        this.data.attributes.checked = state.coalesce(false);
        this.data.events.change = function(control, view) {
            state.set(view.checked);
        };

        return this;
    }
});

};
});
