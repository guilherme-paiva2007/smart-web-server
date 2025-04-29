const { protect } = require( "../util/" );

const Cache = new (require("./cache.js"))();

const EventClass = class Event {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
        Cache.set(name, this);
        protect(this);
    }

    name;
    callback;
}

function Event(name) {
    if (new.target) return new EventClass(...Object.values(arguments));
    return Cache.get(name);
}

Event.remove = function remove(name) {
    const event = Cache.get(name);
    if (!event) return;
    Cache.delete(name);
    return event;
}

protect(Event);

module.exports = Event;