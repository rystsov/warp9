define([], function(){
return function(rere) {

var id = 0;


return (function(state) {
    rere.ui.Input.apply(this, []);

    this.get = function() {
        var self = this;
        this.data.attributes.type="radio";
        this.data.attributes.checked = state.coalesce(false);
        var change = "change" in this.data.events ? this.data.events.change : function(){};
        this.data.events.change = function(control, view) {
            change.apply(self.data.events, [control, view]);
            state.set(view.checked);
        };

        return this;
    }
});

};
});
