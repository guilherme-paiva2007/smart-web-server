const { protect } = require( "../util/" );
const Cache = new (require("./cache.js"))();
const fs = require("fs");
const ReactDOMServer = require("react-dom/server");

const isValidName = RegExp.prototype.test.bind(/\w+/);

class Component {
    constructor(name, file) {
        if (new.target === Component) throw new TypeError("Cannot construct abstract class Component");
        if (!isValidName(name)) throw new Error(`Invalid component name: ${name}`);
        this.name = name;
        this.file = file;
    }

    name;
    file;

    content() {}

    async process(attributes, requestParameters) {}

    async load(attributes, requestParameters) {
        return await this.process(attributes, requestParameters);
    }

    
    static Screen = class ScreenComponent extends Component {
        async content(componentCollection) {
            if (Cache.has(this.name)) return Cache.get(this.name);

            const fileContent = await fs.promises.readFile(this.file);
            const buildParts = componentizeFromHTML(fileContent.toString("utf-8"), componentCollection);
            Object.freeze(buildParts);

            Cache.set(this, buildParts);
            return buildParts;
        }

        async process(attributes, requestParameters) {
            const content = await this.content(requestParameters.server?.components ?? EmptyPlaceholderComponentCollection);
            const parts = [];

            for (const part of content) {
                if (typeof part === "function") {
                    parts.push(await part(requestParameters));
                } else {
                    parts.push(part);
                }
            }

            return parts.join("");
        }
    }

    static Executable = class ExecutableComponent extends Component {
        content() {
            if (Cache.has(this)) return Cache.get(this);
            delete require.cache[require.resolve(this.file)];
            const content = require(this.file);
            Cache.set(this, content);
            return content;
        }

        async process(attributes, requestParameters) {
            return await (await this.content())(attributes, requestParameters);
        }
    }

    static React = class ReactComponent extends Component {
        constructor(name, file) {
            super(name, file);

            if (!this.file.endsWith(".jsx")) throw new TypeError("ReactComponent only accepts .jsx files");
        }

        static {
            require("../util/require-jsx.js")();
        }

        content() {
            if (Cache.has(this)) return Cache.get(this);
            delete require.cache[require.resolve(this.file)];
            const content = require(this.file);
            Cache.set(this, content);
            return content;
        }

        async process(attributes, requestParameters) {
            return ReactDOMServer.renderToString(await (this.content())(attributes, requestParameters));
        }
    }


    static Collection = class ComponentCollection extends Map {
        set(key, value) { throw new Error("ComponentCollection.set() is not supported"); }

        add(component) {
            if (this.has(component.name)) throw new Error(`Component ${component.name} already exists`);
            super.set(component.name, component);
        }
    }

    static {
        this.prototype._type = "abstract";
        this.Screen.prototype._type = "screen";
        this.Executable.prototype._type = "executable";
        this.React.prototype._type = "react";
        this._PublicTypes = Object.freeze([ "screen", "executable", "react" ]);
        this._PublicTypesConstructors = {
            screen: this.Screen,
            executable: this.Executable,
            react: this.React,
        }
        Object.freeze(this._PublicTypesConstructors);
        protect(this.Screen);
        protect(this.Executable);
        protect(this.React);
    }
}

const AttributeRegExp = /(\w+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/
const EmptyPlaceholderComponentCollection = new Component.Collection();
const ComponentRegExp = /<component-(\w+)([^<>]*)\/>/s;

/**
 * Mapeia procurando por componentes e gera um array com as partes do documento.
 */
function componentizeFromHTML(html = "", componentCollection = EmptyPlaceholderComponentCollection) {
    const parts = [];

    if (!ComponentRegExp.test(html)) {
        return [html];
    }

    while (ComponentRegExp.test(html)) {
        const match = html.match(ComponentRegExp);
        let [ tag, name, params ] = match;

        parts.push(html.slice(0, match.index));
        if (componentCollection.has(name)) {
            const attributes = {};

            while (AttributeRegExp.test(params)) {
                const match = params.match(AttributeRegExp);
                const key = match[1];
                const value = match[2] || match[3] || match[4] || true;
                attributes[key] = typeof value === "string" ? value?.replaceAll("&lt;", "<")?.replaceAll("&gt;", ">") : value;
                params = params.slice(match.index + key.length + (value?.length ?? 0) + 1);
            }

            const component = componentCollection.get(name);
            parts.push(component.load.bind(component, attributes));
        } else {
            console.error(`Component ${name} not found in collection`);
            parts.push(tag);
        }
        
        html = html.slice(match.index + tag.length);
    }

    if (html.length) parts.push(html);

    return parts;
}

componentizeFromHTML.EmptyPlaceholderComponentCollection = EmptyPlaceholderComponentCollection;
Component._componentizeFromHTML = componentizeFromHTML;
Component.RegExp = ComponentRegExp;

protect(componentizeFromHTML);
protect(Component);

module.exports = Component;