define(
    ["rere/reactive/Variable", "rere/ui/view/input", "rere/adt/adt"], 
    function(Variable, view, adt) {
        return (function() {
            var self = this;
            this._ui_is = true;
            this._ui_is_input = true;
            this.text = null;
            this.attributes = {};
            this.attributes = function(attributes) {
                this.attributes = attributes;
                return this;
            };
            this.default = function(value) {
                if (value["rere/reactive/Channel"]) {
                    this.text = value;
                } else {
                    this.text = new Variable();
                    this.text.set(value);
                }
                return this;
            };
            this.get = function() {
                if (this.text==null) {
                    this.text = new Variable();
                    this.text.set("");
                }
                return this;
            };
            this.view = view;
        })
    }
);
