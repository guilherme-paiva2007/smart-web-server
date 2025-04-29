let enabled = false;

module.exports = function() {
    if (enabled) return;
    require("@babel/register")({
        presets: [ "@babel/preset-react" ],
        extensions: [ ".jsx" ],
    });
    enabled = true;
}

Object.defineProperty(module.exports, "enabled", {
    get() {
        return enabled
    }
});