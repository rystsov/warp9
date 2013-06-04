define(
    [
      "rere/reactive/Variable", "rere/reactive/variable/vector", 
      "rere/adt/maybe", "rere/ui/view/stickybutton"
    ], 
    function(Variable, vector, maybe, view) {
        function StickyButton() {
            this._ui_is = true;
            this._ui_is_stickybutton = true;
            this.isset = new Variable(new maybe.None());
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
                    var deps = []
                    for(var j in buttons) {
                        if (i==j) continue;
                        deps.push(buttons[j].isset)
                    }
                    buttons[i].isset.follows(
                        vector.or(deps).lift(function(xs){
                            for(var x in xs) {
                                if (!xs[x].isempty() && xs[x].value().hasvalue(true)) {
                                    return new maybe.Some(false);
                                }
                            }
                            return new maybe.None()
                        })
                    )
                })(idx)
            }
        }

        return StickyButton
    }
);
