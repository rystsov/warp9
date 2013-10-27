expose(LiftedList, function(){
    BaseList = root.reactive.lists.BaseList;
    List = root.reactive.List;

    SetLiftedPrototype();
});

var BaseList, List;

function LiftedList(source, f) {
    this.source = source;
    this.f = f;
    BaseList.apply(this);
}

function SetLiftedPrototype() {
    LiftedList.prototype = new BaseList();

    LiftedList.prototype.unwrap = function() {
        return this.source.unwrap().map(function(item){
            return this.f(item);
        }.bind(this));
    };

    var knownEvents = {
        use: "_use",
        leave: "_leave"
    };

    LiftedList.prototype.send = function(event) {
        if (!event.hasOwnProperty("name")) throw new Error("Event must have a name");
        if (knownEvents.hasOwnProperty(event.name)) {
            this[knownEvents[event.name]].apply(this, [event]);
        } else {
            BaseList.prototype.send.apply(this, [event]);
        }
    };

    LiftedList.prototype._use = function(event) {
        BaseList.prototype._use.apply(this, [event]);
        if (this.usersCount === 1) {
            this.source.use(this.listId);
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

    LiftedList.prototype._leave = function(event) {
        BaseList.prototype._leave.apply(this, [event]);
        if (this.usersCount === 0) {
            this.unsubscribe();
            this.unsubscribe = null;
            this.source.leave(this.listId);
        }
    };
}