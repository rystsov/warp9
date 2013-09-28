expose(DomList);

function DomList(list) {
    var Fragment = root.ui.ast.Fragment;
    var Dom = root.ui.dom.Dom;

    this.last = Dom.wrap(new Fragment(document.createElement("script")));
    this.head = null;
    this.elements = null;
    this.hash = {};

    this.bindto = function(element) {
        var self = this;
        this.head = element;
        this.last.bindto(this.head);
        list.subscribe(function(event){
            if (event[0]=="data") {
                if (self.elements!=null) {
                    for (var i=0;i<self.elements.length;i++) {
                        self.elements[i].value.remove();
                    }
                }
                var previous = self.head;
                for (var i=0;i<event[1].length;i++) {
                    self.hash[event[1][i].key] = event[1][i];
                    event[1][i].value.bindto(previous);
                    previous = event[1][i].value;
                }
                self.elements = event[1]
            } else if (event[0]=="add") {
                if (self.elements.length==0) {
                    event[1].value.bindto(self.head);
                } else {
                    event[1].value.bindto(self.elements[self.elements.length-1].value);
                }
                self.elements.push(event[1]);
                self.hash[event[1].key] = event[1]
            } else if (event[0]=="remove") {
                if (event[1] in self.hash) {
                    self.hash[event[1]].value.remove();
                    delete self.hash[event[1]];
                } else {
                    console.log("Dirty behaviour, find dirty behaviour like this isolated at ~/issues/ObservableListElement/doubleDelete.html");
                }
            } else {
                throw new Error();
            }
        })
    };

    this.place = function(html) {
        this.last.place(html);
    };

    this.remove = function() {
        this.last.remove();
        this.place = function(html) {
            this.head.place(html);
        };
    };
}
