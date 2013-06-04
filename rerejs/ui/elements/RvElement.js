define(function() {
    return (function(renderer, rv) {
        var self = this;
        this.last = null;
        this.head = null;
        this.bindto = function(element) {
            this.head = element;
            rv.subscribe(function(obj){
                if (self.last!=null) {
                    self.last.remove();
                };
                self.last = renderer.render(obj);
                self.last.bindto(element);
            });
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
