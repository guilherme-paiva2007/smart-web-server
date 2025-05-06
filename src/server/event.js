const { protect } = require( "../util/" );

const Cache = new (require("./cache.js"))();

// refazer e fazer depender de arquivo.

class Event {
    constructor(name, file) {
        if (Cache.has(name)) return Cache.get(name);
        if (typeof name !== "string") throw new TypeError("Event name must be a string");
        this.name = name;
        this.file = file;
        protect(this);
    }

    name;
    file;

    content() {
        if (Cache.has(this.name)) return Cache.get(this.name);
        delete require.cache[require.resolve(this.file)];
        const content = require(this.file);
        Cache.set(this.name, content);
        return content;
    }

    call(object, parameters) {
        return this.content().call(object, parameters);
    }

    static remove(name) {
        const event = Cache.get(name);
        if (!event) return;
        Cache.delete(name);
        return event;
    }

    static {
        protect(this);
    }
}


module.exports = Event;