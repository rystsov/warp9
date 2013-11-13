expose(List, function(){
    BaseList = root.tng.reactive.lists.BaseList;
    uid = root.idgenerator;

    SetListPrototype();
});

var uid, BaseList;

function List(data) {
    BaseList.apply(this);
    this.attach(List);

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

        var key = uid();
        var value = {key: key, value: f(key)};
        this.data.push(value);

        this.__raise(["add", value]);

        return key;
    };

    List.prototype.setData = function(data) {
        this.data = data.map(function(item){
            return {
                key: uid(),
                value: item
            }
        });
        this.__raise(["data", this.data.slice()]);
    };

    List.prototype.remove = function(key) {
        var length = this.data.length;
        this.data = this.data.filter(function(item){
            return item.key != key;
        });
        if (length!=this.data.length) {
            this.__raise(["remove", key]);
        }
    };

    List.prototype.leak = function(id) {
        id = arguments.length==0 ? this.listId : id;
        BaseList.prototype.leak.apply(this, [id]);
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
