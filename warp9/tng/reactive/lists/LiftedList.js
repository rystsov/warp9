expose(LiftedList, function(){
    BaseList = root.tng.reactive.lists.BaseList;

    SetLiftedPrototype();
});

var BaseList;

function LiftedList(source, f) {
    BaseList.apply(this);
    this.attach(LiftedList);

    this.source = source;
    this.f = f;
}

function SetLiftedPrototype() {
    LiftedList.prototype = new BaseList();

    LiftedList.prototype.unwrap = function() {
        return this.source.unwrap().map(function(item){
            return this.f(item);
        }.bind(this));
    };

    LiftedList.prototype.leak = function(id) {
        id = arguments.length==0 ? this.listId : id;
        BaseList.prototype.leak.apply(this, [id]);
        if (this.usersCount === 1) {
            this.source.leak(this.listId);
            this.unsubscribe = this.source.onEvent(List.handler({
                data: function(data) {
                    this.data = data.map(function(item){
                        return {key: item.key, value: this.f(item.value)};
                    }.bind(this));
                    this.__raise(["data", this.data.slice()]);
                }.bind(this),
                add: function(item) {
                    item = {key: item.key, value: this.f(item.value)};
                    this.data.push(item);
                    this.__raise(["add", item]);
                }.bind(this),
                remove: function(key){
                    this.data = this.data.filter(function(item){
                        return item.key != key;
                    });
                    this.__raise(["remove", key]);
                }.bind(this)
            }))
        }
    };

    LiftedList.prototype.seal = function(id) {
        id = arguments.length==0 ? this.listId : id;
        BaseList.prototype.seal.apply(this, [id]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.seal(this.listId);
        }
    };
}