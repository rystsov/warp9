var rere = require('../../rere.common');

var Cell = rere.reactive.Cell;

module.exports = EventSink;

function EventSink(cell) {
    this.event = null;
    this.changes = 0;

    cell.onEvent(Cell.handler({
        set: function(value) {
            this.event = [value];
        }.bind(this),
        unset: function() {
            this.event = [];
        }.bind(this)
    }));
}

EventSink.prototype.unwrap = function() {
    if (this.event==null || this.event.length==0) {
        if (arguments.length==0) throw new Error();
        return arguments[0];
    }
    return this.event[0];
}