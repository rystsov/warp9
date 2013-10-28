expose(new EventBroker());

function EventBroker() {
    this.messages = [];
    this.isActive = false;

    this.issue = function(reciever, event) {
        this.messages.push([reciever, event]);
        if (this.isActive) return;
        this.isActive = true;
        while(this.messages.length!=0) {
            var message = this.messages.shift();
            message[0].send(message[1]);
        }
        this.isActive = false;
    };
}
