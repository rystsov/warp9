define([], function() {
return function(rere) {

var rv = rere.future("reactive/rv");
var Variable = rere.future("reactive/Variable");

return function(f) {
    function id(x) { return x; }
    var head = new (Variable())();
    
    this.root = null;
    this.base = null;
    this.baseMark = null;

    if (arguments.length==2) {
        this.head = (rv()).batch(head.bind(id).coalesce(arguments[1]));
    } else {
        this.head = (rv()).batch(head.bind(id));
    }
    

    this.add = function(key, value) {
        this.head.batch();
        this.checkInited();
        this.checkExpand();
        this.base[this.baseMark].watchRv(key, value);
        this.baseMark++;
        this.head.commit();
    };
    this.remove = function(key) {
        this.head.batch();
        for (var i=0;i<this.baseMark;i++) {
            if (this.base[i].source.key===key) {
                this.base[i].unset();
                if (i!=this.baseMark-1) {
                    key = this.base[this.baseMark-1].source.key;
                    value = this.base[this.baseMark-1].source.value;
                    this.base[this.baseMark-1].unset();
                    this.base[i].watchRv(key, value);
                }
                this.baseMark--
                break;
            }
        }
        this.head.commit();
    };
    this.checkInited = function() {
        if (this.root==null) {
            this.root = new Node(f);
            this.base = [this.root];
            this.baseMark = 0;
            head.set(this.root.data);
        }
    };
    this.checkExpand = function() {
        var self = this;

        if (this.baseMark<this.base.length) return;
        var root = new Node(f);
        root.childs.push({
            value: this.root
        });
        root.childs.push({
            value: cloneTreeStructure(this.root)
        });
        for (var child in root.childs) {
            root.childs[child].value.father = root;
        }
        root.bindChilds();
        this.root = root;
        expandBase();
        head.set(this.root.data);

        function expandBase() {
            self.base = [];
            walk(self.root);

            function walk(node) {
                if (node.childs.length==0) {
                    self.base.push(node);
                } else {
                    for (var child in node.childs) {
                        walk(node.childs[child].value);
                    }
                }
            }
        }

        function cloneTreeStructure(tree) {
            var clone = new Node(f);
            for (var child in tree.childs) {
                var child = cloneTreeStructure(tree.childs[child]);
                child.father = clone;
                clone.childs.push({
                    value: child
                });
            }
            return clone;
        }
    };
    this.dump = function() {
        this.checkInited();
        console.info(dump(this.root));

        function dump(node) {
            if (node.isLeaf()) {
                if (node.data.value().isempty()) {
                    return "()"
                } else {
                    return "(=" + node.data.value().value() + ")";
                }
            } else {
                var result = "(";
                if (!node.data.value().isempty()) {
                    result = "(=" + node.data.value().value() + "  ";
                }
                result+=dump(node.childs[0].value);
                for(var i=1;i<node.childs.length;i++) {
                    result += "  " + dump(node.childs[i].value);
                }
                result += ")"
                return result;
            }
        }
    };
};

function Node(f) {
    this.father = null;
    this.childs = [];
    this.isActive = false;
    this.data = new (Variable())();
    this.dispose = null;
    this.bindChilds = function() {
        if (this.childs.length>2) throw new Error();
        
        var self = this;
        var wasActive = this.isActive;

        if (this.isActive) {
            this.dispose();
        }
        var active = this.childs.filter(function(child){
            return child.value.isActive;
        });
        
        if (active.length==0) {
            this.isActive = false;
        } else if (active.length==1) {
            this.isActive = true;
            var unsubscribe = this.data.follows(active[0].value.data);
            this.dispose = function() {
                unsubscribe();
                self.dispose = null;
            };
        } else {
            this.isActive = true;
            var combed = (rv()).sequenceMap([active[0].value.data, active[1].value.data], f);
            var unsubscribe = this.data.follows(combed);
            this.dispose = function() {
                unsubscribe();
                combed.dispose();
                self.dispose = null;
            };
        }
        if (wasActive && this.isActive) return;
        if (!wasActive && !this.isActive) return;
        if (this.father!=null) {
            this.father.bindChilds();
        }
    };
    this.watchRv = function(key, rv) {
        this.isActive = true;
        this.source = {
            key: key,
            value: rv,
            unsubscribe: this.data.follows(rv)
        };
        if (this.father!=null) {
            this.father.bindChilds();
        }
    };
    this.unset = function() {
        if (!this.isActive) throw new Error();
        if (!this.isLeaf()) throw new Error();
        this.isActive = false;
        this.source.unsubscribe();
        this.source = null;
        this.data.unset();
        if (this.father!=null) {
            this.father.bindChilds();
        }
    };
    this.isLeaf = function() {
        return this.childs.length==0;
    };
}

};
});
