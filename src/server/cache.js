let enabled = true;

class Cache extends Map {
    get(key) {
        if (enabled) return super.get(key); else return false;
    }

    set(key, value) {
        if (enabled) return super.set(key, value); else return this;
    }

    has(key) {
        if (enabled) return super.has(key); else return false;
    }

    static get enabled() { return enabled }
    static set enabled(value) { enabled = Boolean(value) }
}

module.exports = Cache;