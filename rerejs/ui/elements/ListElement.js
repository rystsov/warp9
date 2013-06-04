define(function() {
    return function(elements) {
        this.last = null;
        this.head = null;
        this.bindto = function(element) {
            this.head = element;
            var previous = element;
            for (var i=0;i<elements.length;i++) {
                elements[i].bindto(previous);
                previous = elements[i];
                this.last = previous;
            }
        };
        this.place = function(html) {
            if (this.last != null) {
                this.last.place(html);
            } else {
                this.head.place(html);
            }
        };
        this.remove = function() {
            for (var i=0;i<this.elements.length;i++) {
                this.elements[i].remove();
            }
        };
    }
});
