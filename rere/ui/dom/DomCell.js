expose(DomCell);

var id = 0;

function DomCell(rv) {
    var Cell = root.reactive.Cell;

    this.last = null;
    this.head = null;
    this.cellId = "rere/ui/dom/cell/" + (id++);
    this.dispose = function() {};
    this.bindto = function(element) {
        var self = this;

        this.head = element;
        this.dispose = rv.onEvent([], Cell.handler({
            set: function(e) {
                if (self.last!=null) {
                    self.last.remove();
                }
                self.last = e;
                self.last.bindto(element);
            },
            unset: function() {
                if (self.last!=null) {
                    self.last.remove();
                    self.last = null;
                }
            }
        }));
        var block = {
            id: this.cellId,
            cells: {}
        };
        block.cells[rv.id] = rv;
    };
    this.place = function(html) {
        if (this.last==null) {
            this.head.place(html);
        } else {
            this.last.place(html);
        }
    };
    this.remove = function() {
        this.dispose();
        if (this.last!=null) {
            this.last.remove();
            this.last = null;
        }
    };
}
