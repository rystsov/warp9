define([], function() {
return function(rere) {

return {
    "button" : function() { return new rere.ui.Button(); },
    "linkbutton" : function() { 
        var button = new rere.ui.Button()
        button.css = function(css) {
            this.view = rere.ui.view.linkbutton(css);
            return this;
        }
        button.view = rere.ui.view.linkbutton();
        return button; 
    },
    "div" : function() { return new rere.ui.Div(); },
    "input" : function() { return new rere.ui.Input(); },
    "span" : function() { return new rere.ui.Span(); },
    "text" : function(text) { return new rere.ui.Text(text); },
    "stickybutton" : function() { return new rere.ui.StickyButton(); },
    "radiobutton" : function() { 
        var button = new rere.ui.StickyButton();
        button.view = rere.ui.view.radiobutton;
        return button; 
    },
    "checkbutton" : function() { 
        var button = new rere.ui.StickyButton();
        button.view = rere.ui.view.checkbutton;
        return button; 
    },
    "combobox" : function() { return new rere.ui.ComboBox(); }
};

};
});
