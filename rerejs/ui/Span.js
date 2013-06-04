define(["rere/reactive/Variable", "rere/ui/view/span"], function(Variable, view) {
    return (function() {
        var self = this;
        this._ui_is = true;
        this._ui_is_span = true;
        this.data = {
            content: {},
            attributes: {}
        };
        this.content = function(content) {
            this.data.content = content;
            return this;
        };
        this.attributes = function(attributes) {
            this.data.attributes = attributes
            return this;
        };
        this.get = function() {
            return this;
        };
        this.view = view;
    })
});
