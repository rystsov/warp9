define(
    [
      "rere/reactive/Variable", "rere/reactive/variable/vector", 
      "rere/adt/maybe", "rere/ui/view/stickybutton"
    ], 
    function(Variable, vector, maybe, view) {
        function StickyButton() {
            this._ui_is = true;
            this._ui_is_stickybutton = true;
            this.isset = new Variable();
            this.data = {
                label: "Button1"
            };
            this.label = function(text) {
                this.data.label = text;
                return this;
            };
            this.get = function() {
                return this;
            };
            this.view = view;
        }

        StickyButton.oneof = function(buttons) {
            for(var idx in buttons) {
                (function(i){
                    buttons[i].isset.onEvent(function(e){
                        if (e[0]==="set" && e[1]===true) {
                            for (var j in buttons) {
                                if (j==i) continue;
                                buttons[j].isset.set(false);
                            }
                        }
                    });
                })(idx)
            }
        }

        return StickyButton
    }
);
