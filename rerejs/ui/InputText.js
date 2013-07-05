define([], function(){
return function(rere) {

var id = 0;


return (function(state) {
    rere.ui.Input.apply(this, []);

    this.get = function() {
        var self = this;
        this.data.attributes.type="text";
        this.data.attributes.value = state;
        var input = "input" in this.data.events ? this.data.events.input : function(){};
        this.data.events.input = function(control, view) {
            input.apply(self.data.events, [control, view]);
            state.set(view.value);
        };

        return this;
    }
});

};
});
