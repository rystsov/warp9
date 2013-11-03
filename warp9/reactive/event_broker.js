expose(new EventBroker());

function EventBroker() {
    this.events = [];
    this.isActive = false;

    this.issue = function(reciever, event) {
        this.events.push({
            type: "message",
            body: [reciever, event]
        });
        this.process();
    };

    this.call = function(f) {
        if (f instanceof Array) {
            for (var i=0;i < f.length;i++) {
                if (typeof f[i] != "function") throw new Error();
                this.events.push({
                    type: "call",
                    f: f[i]
                });
            }
        } else if (typeof f == "function") {
            this.events.push({
                type: "call",
                f: f
            });
        } else {
            throw new Error();
        }

        this.process();
    };

    this.process = function() {
        if (this.isActive) return;
        this.isActive = true;
        while(this.events.length!=0) {
            var event = this.events.shift();
            if (event.type=="message") {
                var message = event.body;
                message[0].send(message[1]);
            } else if (event.type=="call") {
                event.f();
            } else {
                throw new Error();
            }
        }
        this.isActive = false;
    };
}
