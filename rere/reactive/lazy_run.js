expose(new LazyRun());

function LazyRun() {
    this.functions = [];
    this.isActive = false;

    this.postpone = function(f) {
        this.functions.push(f);
    };

    this.run = function() {
        if (this.isActive) return;
        this.isActive = true;
        while(this.functions.length!=0) {
            var f = this.functions.shift();
            f();
        }
        this.isActive = false;
    };
}
