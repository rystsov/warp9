expose(new LazyRun());

function LazyRun() {
    this.functions = [];
    this.isActive = false;
    this.isCallback = false;
    this.root = null;

    this.postpone = function(f) {
        if (this.isCallback) throw new Error("Can't postpone or run a task during callback");
        var item = {
            f: f,
            father: this.root,
            children: 0,
            callback: arguments.length==1 ? null : arguments[1]
        };
        if (this.isActive) {
            this.root.children++;
        }
        this.functions.push(item);
    };

    this.run = function() {
        if (this.isCallback) throw new Error("Can't postpone or run a task during callback");
        if (arguments.length>0) {
            this.postpone.apply(this, arguments);
        }

        if (this.isActive) return;
        this.isActive = true;
        while(this.functions.length!=0) {
            var item = this.functions.shift();
            this.root = item;
            item.f();
            this.finalize(item);
        }
        this.root = null;
        this.isActive = false;
    };

    this.finalize = function(item) {
        if (item.children<0) throw new Error("Inconsistent internal state");
        if (item.children==0) {
            if (item.callback != null) {
                this.isCallback = true;
                item.callback();
                this.isCallback = false;
            }
            if (item.father==null) return;
            item.father.children--;
            this.finalize(item.father);
        }
    };
}
