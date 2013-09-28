exclude(Sigma, function() {
    Cell = rere.reactive.Cell;
});

var Cell;

function Sigma(group, wrap, unwrap) {
    wrap = wrap || function(x) { return x; };
    unwrap = unwrap || function(x) { return x; };

    var sum = group.identity();
    var blocks = 0;

    this.value = new Cell(unwrap(sum));

    this.add = function(value) {
        if (typeof value === "object" && value.type === Cell) {
            var last = null;
            var isBlocked = false;
            var unsubscribe = value.onEvent([this.value], Cell.handler({
                "set": function(value) {
                    if (isBlocked) {
                        blocks--;
                        isBlocked = false;
                    }
                    if (last!=null) {
                        sum = group.add(sum, group.invert(last.value));
                    }
                    last = { value: wrap(value) };
                    sum = group.add(sum, last.value);
                    if (blocks==0) {
                        this.value.set(unwrap(sum));
                    }
                }.bind(this),
                "unset": function() {
                    if (!isBlocked) {
                        isBlocked = true;
                        blocks++;
                        this.value.unset();
                    }
                }.bind(this)
            }));

            return function() {
                unsubscribe();
                if (last!=null) {
                    sum = group.add(sum, group.invert(last.value));
                    last = null;
                }
                if (isBlocked) {
                    blocks--;
                    isBlocked = false;
                    if (blocks==0) {
                        this.value.set(unwrap(sum));
                    }
                }
            }.bind(this);
        } else {
            sum = group.add(sum, wrap(value));
            this.value.set(unwrap(sum));
            return function() {
                sum = group.add(sum, group.invert(value));
                this.value.set(unwrap(sum));
            }.bind(this);
        }
    };
}