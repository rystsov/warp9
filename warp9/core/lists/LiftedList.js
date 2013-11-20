expose(LiftedList, function(){
    BaseList = root.core.lists.BaseList;
    event_broker = root.core.event_broker;
    DAG = root.core.dag.DAG;

    SetLiftedPrototype();
});

var BaseList, event_broker, DAG;

function LiftedList(source, f) {
    BaseList.apply(this);
    this.attach(LiftedList);

    this.source = source;
    this.f = f;
    this.data = null;
}

function SetLiftedPrototype() {
    LiftedList.prototype = new BaseList();

    // dependenciesChanged is being called during propagating only (!)

    LiftedList.prototype.dependenciesChanged = function() {
        if (!this.changed.hasOwnProperty(this.source.nodeId)) {
            throw new Error();
        }

        var changesIn  = this.changed[this.source.nodeId];
        var info = {
            hasChanges: true,
            changeSet: []
        };

        for (var i=0;i<changesIn.length;i++) {
            var change = changesIn[i];
            if (change[0]=="reset") {
                this.data = [];
                for (var j=0;j<change[1].length;j++) {
                    this.data.push({
                        key: change[1][j].key,
                        value: this.f(change[1][j].value)
                    });
                }
                info.changeSet.push(["reset", this.data.slice()]);
                this._putEventToDependants(["reset", this.data.slice()]);
            } else if (change[0]=="add") {
                var added = {
                    key: change[1].key,
                    value: this.f(change[1].value)
                };
                this.data.push(added);
                info.changeSet.push(["add", added]);
                this._putEventToDependants(["add", added]);
            } else if (change[0]=="remove") {
                var nova = [];
                for (var k=0;k<this.data.length;k++) {
                    if (this.data[k].key===change[1]) continue;
                    nova.push(this.data[k]);
                }
                this.data = nova;
                info.changeSet.push(["remove", change[1]]);
                this._putEventToDependants(["remove", change[1]]);
            } else {
                throw new Error("Unknown event: " + change[0]);
            }
        }
        event_broker.notify(this);

        this.changed = {};

        return info;
    };

    // _leak & _seal are called only by onChange

    LiftedList.prototype._leak = function(id) {
        BaseList.prototype._leak.apply(this, [id]);

        if (this.usersCount === 1) {
            DAG.addNode(this);
            this.source._leak(this.nodeId);
            DAG.addRelation(this.source, this);

            this.data = [];
            for (var j=0;j<this.source.data.length;j++) {
                this.data.push({
                    key: this.source.data[j].key,
                    value: this.f(this.source.data[j].value)
                });
            }
        }
    };

    LiftedList.prototype._seal = function(id) {
        id = arguments.length==0 ? this.nodeId : id;
        BaseList.prototype._seal.apply(this, [id]);

        if (this.usersCount === 0) {
            DAG.removeRelation(this.source, this);
            this.source._seal(this.nodeId);
            DAG.removeNode(this);
            this.data = null;
        }
    };

    // gets

    LiftedList.prototype.get = function() {
        if (this.usersCount > 0) {
            return this.data.map(function(item){
                return item.value;
            });
        } else {
            var data = this.source.get();
            var result = [];
            for (var j=0;j<data.length;j++) {
                result.push(this.f(data[j]));
            }
            return result;
        }
    };
}