define(
    [ 
      "rere/ui/Button", "rere/ui/Div", 
      "rere/ui/Input", "rere/ui/Span", 
      "rere/ui/StickyButton", "rere/ui/ComboBox",
      "rere/ui/view/linkbutton", "rere/ui/view/radiobutton",
      "rere/ui/view/checkbutton", "rere/ui/Text"
    ], 
    function(Button, Div, Input, Span, StickyButton, ComboBox, linkbutton, radiobutton, checkbutton, Text) {
        return {
            "button" : function() { return new Button(); },
            "linkbutton" : function() { 
                var button = new Button()
                button.css = function(css) {
                    this.view = linkbutton(css);
                    return this;
                }
                button.view = linkbutton();
                return button; 
            },
            "div" : function() { return new Div(); },
            "input" : function() { return new Input(); },
            "span" : function() { return new Span(); },
            "text" : function(text) { return new Text(text); },
            "stickybutton" : function() { return new StickyButton(); },
            "radiobutton" : function() { 
                var button = new StickyButton();
                button.view = radiobutton;
                return button; 
            },
            "checkbutton" : function() { 
                var button = new StickyButton();
                button.view = checkbutton;
                return button; 
            },
            "combobox" : function() { return new ComboBox(); }
        }
    }
);
