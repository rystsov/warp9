expose(List);

var listId = 0;

function List(data) {
    var self = this;
    var elementId = 0;

    this.type = List;

    this.handlers   = [];
    this.handlersId = 0;
    this.data = [];
    this.id = listId++;
    var count = new root.reactive.Cell(0);

    this.count = function() {
        if (arguments.length===0) return count;

        var f = arguments[0];
        var matches = new Cell(0);
        var subscribes = {};

        this.subscribe(List.handler({
            data: function(e) {
                var matched = 0;
                for (var i=0;i < e.length;i++) {
                    if (add(e[i].key, e[i].value)) matched++;
                }
                if (matched>0) {
                    matches.set(matches.unwrap()+matched);
                }
            },
            add: function(e) {
                add(e.key, e.value);
            },
            remove: function(e) {
                if (e in subscribes) {
                    subscribes[e]();
                    delete subscribes[e];
                }
            }
        }));

        return matches;

        function add(key, item) {
            var mark = f(item);
            if (typeof mark === "boolean") {
                return mark;
            } else if (typeof mark === "object" && mark.type === Cell) {
                var isSet = false;
                var unsubscribe = mark.onEvent([matches], Cell.handler({
                    "set": function(value) {
                        if (value == isSet) return;
                        matches.set(matches.unwrap()+(isSet ? -1: 1));
                        isSet = value;
                    },
                    "unset": function() {
                        if (isSet) {
                            matches.set(matches.unwrap()-1);
                            isSet = false;
                        }
                    }
                }));
                subscribes[key] = function() {
                    if (isSet) {
                        matches.set(matches.unwrap()-1);
                    }
                    unsubscribe();
                }
            } else {
                throw new Error();
            }
            return false;
        }
    };

    this.setData = function(data) {
        var length = this.data.length;
        this.data = data.map(function(item){
            return {
                key: elementId++,
                value: item
            }
        });
        if (length!=this.data.length) {
            count.set(this.data.length);
        }
        for (var i=0; i<this.handlers.length; i++) {
            this.handlers[i].f([
                "data",
                this.data.slice()
            ]);
        }
    };

    this.remove = function(key) {
        var removed = false;
        var length = this.data.length;
        this.data = this.data.filter(function(item){
            return item.key != key;
        });
        if (length!=this.data.length) {
            count.set(this.data.length);
            removed = true;
        }
        for (var i=0;i<this.handlers.length;i++) {
            this.handlers[i].f(["remove", key]);
        }
        return removed;
    };

    this.removeWhich = function(f) {
        this.data.filter(function(item) {
            return f(item.value);
        }).forEach(function(item){
            this.remove(item.key);
        }.bind(this));
    };

    this.add = function(f) {
        if (typeof(f) != "function") throw new Error();
        var key = elementId++;
        var e = {key: key, value: f(key)};
        this.data.push(e);
        count.set(this.data.length);
        for (var i=0;i<this.handlers.length;i++) {
            this.handlers[i].f(["add", e]);
        }
    };

    this.addKeyValue = function(key, value) {
        var e = {key: key, value: value};
        this.data.push(e);
        count.set(this.data.length);
        for (var i=0;i<this.handlers.length;i++) {
            this.handlers[i].f(["add", e]);
        }
    };

    this.lift = function(f) {
        var nova = new List([]);
        this.subscribe(List.handler({
            data: function(e) { nova.setData(e.map(function(i){ return f(i.value); })); },
            add: function(e) { nova.addKeyValue(e.key, f(e.value)); },
            remove: function(e) { nova.remove(e); }
        }));
        return nova;
    };

    this.subscribe = function(f) {
        var id = this.handlersId++;
        this.handlers.push({key: id, f:f});
        f(["data", this.data.slice()]);
        return function() {
            self.handlers = self.handlers.filter(function(handler) {
                return handler.key!=id;
            });
        }
    };

    this.setData(data);
}

List.handler = function(handlers) {
    return function(e) {
        while(true) {
            if (e[0]==="data") break;
            if (e[0]==="add") break;
            if (e[0]==="remove") break;
            throw new Error();
        }
        handlers[e[0]].call(handlers, e[1]);
    };
};