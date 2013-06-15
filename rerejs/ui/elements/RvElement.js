define(
["rere/reactive/Variable"], 
function(Variable) {

return (function(renderer, rv) {
    var self = this;
    this.last = null;
    this.head = null;
    this.bindto = function(element) {
        this.head = element;
        
        rv.onEvent(Variable.handler({
            set: function(e) {
                if (self.last!=null) {
                    self.last.remove();
                };
                self.last = renderer.render(e);
                self.last.bindto(element);
            },
            unset: function() {
                if (self.last!=null) {
                    self.last.remove();
                    self.last = null;
                };
            }
        }));
    };
    this.place = function(html) {
        if (this.last==null) {
            this.head.place(html);
        } else {
            this.last.place(html);
        }
    };
    this.remove = function() {
        throw new Error();
    };
});

});
