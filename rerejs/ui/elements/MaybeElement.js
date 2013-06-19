define([], function() {
return function(rere) {

return (function(renderer, maybe) {
    var self = this;
    this.last = null;
    this.head = null;
    this.bindto = function(element) {
        this.head = element;
        if (!maybe.isempty()) {
            self.last = renderer.render(maybe.value());
            self.last.bindto(element);
        }
    };
    this.place = function(html) {
        if (this.last==null) {
            this.head.place(html);
        } else {
            this.last.place(html);
        }
    };
    this.remove = function() {
        if (this.last!=null) {
            this.last.remove()
        }
    };
});

};
});
