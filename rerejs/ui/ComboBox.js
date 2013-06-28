define([], function(){
return function(rere) {

return (function(state) {
    rere.ui.Element.ctor.apply(this);

    this._ui_is_combobox = true;
    
    this.get = function() {
        var self = this;
        this.data.attributes.value = state;
        var change = "change" in this.data.events ? this.data.events.change : function(){};
        this.data.events.change = function(control, view) {
            change.apply(self.data.events, [control, view]);
            state.set(view.value);
        };
        return this;
    };
    
    this.view = function(element){
        return rere.ui.Element.renderContainer(element, document.createElement("select"));
    };
});

};
});
