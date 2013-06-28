define([], function(){
return function(rere) {

return (function() {
    rere.ui.Element.ctor.apply(this);

    this._ui_is_option = true;
    
    this.view = function(element){
        var option = document.createElement("option");
        option.appendChild(document.createTextNode(this.data.content[0]));
        return rere.ui.Element.renderSingle(element, option);
    };
});

};
});
