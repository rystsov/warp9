expose(List, function(){
    BaseList = root.reactive.lists.BaseList;
    Cell = root.reactive.Cell;

    SetListPrototype();
});

var BaseList, Cell;

function List(data) {
    this._elementId = 0;
    BaseList.apply(this);

    this.setData(data ? data : []);
}

function SetListPrototype() {
    List.prototype = new BaseList();

    List.prototype.unwrap = function() {
        return this.data.map(function(item){
            return item.value;
        });
    };

    List.prototype.add = function(f) {
        if (typeof(f) != "function") {
            var item = f;
            f = function(id) { return item; };
        }

        var event = {
            name: "add",
            key: this._elementId++,
            f: f
        };

        root.reactive.event_broker.issue(this, event);

        return event.key;
    };

    List.prototype.setData = function(data) {
        root.reactive.event_broker.issue(this, {
            name: "setData",
            data: data
        });
    };

    List.prototype.remove = function(key) {
        root.reactive.event_broker.issue(this, {
            name: "remove",
            key: key
        });
    };

    List.prototype.forEach = function(callback) {
        root.reactive.event_broker.issue(this, {
            name: "forEach",
            callback: callback
        });
    };

    List.prototype.removeWhich = function(f) {
        root.reactive.event_broker.issue(this, {
            name: "removeWhich",
            f: f
        });
    };

    var knownEvents = {
        add: "_add",
        setData: "_setData",
        remove: "_remove",
        forEach: "_forEach",
        removeWhich: "_removeWhich",
        use: "_use"
    };

    List.prototype.send = function(event) {
        if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
        if (knownEvents.hasOwnProperty(event.name)) {
            this[knownEvents[event.name]].apply(this, [event]);
        } else {
            BaseList.prototype.send.apply(this, [event]);
        }
    };

    List.prototype._add = function(event) {
        if (event.name != "add") throw new Error();
        var e = {key: event.key, value: event.f(event.key)};
        this.data.push(e);
        this.__raise(["add", e]);
    };

    List.prototype._setData = function(event) {
        if (event.name != "setData") throw new Error();
        this.data = event.data.map(function(item){
            return {
                key: this._elementId++,
                value: item
            }
        }.bind(this));
        this.__raise(["data", this.data.slice()]);
    };

    List.prototype._remove = function(event) {
        if (event.name != "remove") throw new Error();
        var length = this.data.length;
        this.data = this.data.filter(function(item){
            return item.key != event.key;
        });
        if (length!=this.data.length) {
            this.__raise(["remove", event.key]);
        }
    };

    List.prototype._forEach = function(event) {
        if (event.name != "forEach") throw new Error();
        for(var i=0;i<this.data.length;i++) {
            event.callback(this.data[i].value);
        }
    };

    List.prototype._removeWhich = function(event) {
        if (event.name != "removeWhich") throw new Error();
        this.data.filter(function(item) {
            return event.f(item.value);
        }).forEach(function(item){
            this.remove(item.key);
        }.bind(this));
    };

    List.prototype._use = function(event) {
        BaseList.prototype._use.apply(this, [event]);
        if (this.usersCount === 1) {
            this.__raise(["data", this.data.slice()]);
        }
    };
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
