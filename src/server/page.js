const path = require("path");
const fs = require("fs");
const Cache = new (require("./cache.js"));
const { protect, ScreenDocument } = require( "../util/" );
const ReactDOMServer = require("react-dom/server");
const React = require("react");
const { _componentizeFromHTML } = require("./component.js");

const defaultContentTypesForEXT = {
    ".js": "text/javascript",
    ".html": "text/html",
    ".css": "text/css",
    ".json": "application/json",
    ".xml": "application/xml",
    ".svg": "image/svg+xml",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".rar": "application/vnd.rar",
    ".7z": "application/x-7z-compressed",
    ".exe": "application/x-msdownload",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

const ProtectedSetPermissionKey = Symbol("ProtectedSet.PermissionKey");

class ProtectedSet extends Set {
    add(value, key) {
        if (key !== ProtectedSetPermissionKey) throw new TypeError("Cannot change values of a protected Set");
        return super.add(value);
    }

    delete(value, key) {
        if (key !== ProtectedSetPermissionKey) throw new TypeError("Cannot change values of a protected Set");
        return super.delete(value);
    }

    clear(key) {
        if (key !== ProtectedSetPermissionKey) throw new TypeError("Cannot change values of a protected Set");
        return super.clear(key);
    }
}

const ReadStreamDefaultOptions = {
    highWaterMark: 64 * 1024,
    autoClose: true,
}

const EmptyPlaceholderComponentCollection = new (require("./component.js")).Collection();

class Page {
    constructor(paths, file, { contentType, events } = {}) {
        if (new.target === Page) throw new TypeError("Cannot construct abstract class Page");
        if (typeof paths === "string") paths = [ paths ];
        if (!(paths instanceof Array)) throw new TypeError("Paths must be a string or an array of strings");
        
        for (let singlePath of paths) {
            try {
                if (typeof singlePath !== "string") throw new TypeError("paths must be a string or an array of strings");
                if (singlePath.startsWith("/")) singlePath = singlePath.slice(1);
                if (singlePath.endsWith("/")) singlePath = singlePath.slice(0, -1);

                let subPaths = singlePath.split("/");

                const pathObj = {
                    name: `/${singlePath}`,
                    regexp: [],
                    params: [],
                };

                for (const subPath of subPaths) {
                    if (subPath.startsWith("[") && subPath.endsWith("]"))  {
                        let paramName = subPath.slice(1, -1);
                        pathObj.params.push(paramName);
                        pathObj.regexp.push(`([^/]+)`);
                    } else {
                        if (encodeURIComponent(subPath) !== subPath) {
                            throw new TypeError(`Invalid path to page contain special characters ("${subPath}"")`);
                        }
                        pathObj.regexp.push(subPath);
                    }
                }

                pathObj.regexp = new RegExp(`^/${pathObj.regexp.join("/")}/?$`);

                this.paths.push(pathObj);
            } catch (err) {
                console.error(err);
            }
        }

        Object.freeze(this.paths);

        if (typeof file !== "string") throw new TypeError("File must be a string");

        const fileParsed = path.parse(file);
        
        this.file = file;
        if (contentType) this.contentType = contentType; else this.contentType = defaultContentTypesForEXT[fileParsed.ext];

        if (events) {
            if (typeof events !== "object") throw new TypeError("Events must be an object");

            for (let [ eventName, callbacks ] of Object.entries(events)) {
                if (typeof callbacks === "function") callbacks = [ callbacks ];
                if (!(callbacks instanceof Array)) throw new TypeError("An event must be a function or an array of functions");
                
                this.events[eventName] = [];
                for (const callback of callbacks) {
                    if (typeof callback !== "function") throw new TypeError("An event must be a function or an array of functions");
                    this.events[eventName].push(callback);
                }
                Object.freeze(this.events[eventName]);
            }
        }

        Object.freeze(this.events);
    }

    paths = [];
    file;
    contentType;
    events = {};
    dependencies = new ProtectedSet();

    match(url) {
        for (const path of this.paths) {
            const match = path.regexp.exec(url);
            if (match) {
                let params = {};

                for (let i = 1; i < match.length; i++) {
                    params[path.params[i - 1]] = decodeURIComponent(match[i]);
                }

                return params;
            }
        }
        return null
    }

    content() {} // sobreescrever, procura por cache ou arquivo

    async process() {} // sobreescrever, acessa content

    async _emitEvent(eventName, parameters) {
        let collection = parameters.server.pages;
        
        if (this.events[eventName]) {
            for (const callback of this.events[eventName]) {
                await callback.call(null, parameters);
            }
        }

        if (collection && collection.events[eventName]) {
            for (const callback of collection.events[eventName]) {
                await callback.call(null, parameters);
            }
        }
    }

    async load(parameters = { }) {
        await this._emitEvent("before", parameters);

        parameters.content.append(await this.process(parameters));

        await this._emitEvent("after", parameters);
    }



    static Screen = class ScreenPage extends Page {
        async content(componentCollection) {
            if (Cache.has(this)) return Cache.get(this);
            
            const fileContent = await fs.promises.readFile(this.file);
            const buildParts = _componentizeFromHTML(fileContent.toString("utf-8"), componentCollection);
            Object.freeze(buildParts);

            Cache.set(this, buildParts);
            return buildParts;
        }

        async process(parameters) {
            const content = await this.content(parameters.server?.components ?? EmptyPlaceholderComponentCollection);
            const parts = [];

            for (const part of content) {
                if (typeof part === "function") {
                    parts.push(await part(parameters));
                } else {
                    parts.push(part);
                }
            }

            return parts.join("");
        }
    }

    static Asset = class AssetPage extends Page {
        constructor(paths, file, parameters) {
            super(paths, file, parameters);

            const writeInResponse = (response, chunk) => { response.write(chunk) }

            this._streamPromiseHandler = (response, resolve, reject) => {
                const stream = this.content();
                stream.on("data", writeInResponse.bind(null, response));
                stream.on("end", resolve);
                stream.on("error", reject);
            }

            protect(this);
        }

        content() {
            return fs.createReadStream(this.file, ReadStreamDefaultOptions);
        }

        _streamPromiseHandler;

        process(parameters) {
            return new Promise(this._streamPromiseHandler.bind(this, parameters.response));
        }
    }

    static Executable = class ExecutablePage extends Page {
        content() {
            if (Cache.has(this)) return Cache.get(this);
            delete require.cache[require.resolve(this.file)];
            const content = require(this.file);
            Cache.set(this, content);
            return content;
        }

        async process(parameters) {
            return await this.content()(parameters);
        }
    }

    static Rest = class RestPage extends Page {
        content() {
            if (Cache.has(this)) return Cache.get(this);
            delete require.cache[require.resolve(this.file)];
            const content = require(this.file);
            Cache.set(this, content);
            return content;
        }

        async process(parameters) {
            return JSON.stringify(await this.content()[parameters.request.method.toLowerCase()](parameters));
        }
    }

    static React = class ReactPage extends Page { // Server-Side Rendering
        constructor(paths, file, parameters) {
            super(paths, file, parameters);

            if (!this.file.endsWith(".jsx")) throw new TypeError("ReactPage only accepts .jsx files");
            this.contentType = "text/html";

            const parsedPath = path.parse(this.file);
            const bundle = new Page.Asset(
                this.paths.map(pathObject => path.join(pathObject.name, "bundle.js").replaceAll("\\", "/")), // arquivo _bundle.js, página bundle.js
                path.join(parsedPath.dir, parsedPath.name, "_bundle.js")
            );
            this.dependencies.add(bundle, ProtectedSetPermissionKey);

            // adicionar hidratação + um corpo de documento padrão
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
        
        async process(parameters) {
            // const parsedPath = path.parse(this.file);

            // const hydrateBundleFile = path.join(parsedPath.dir, parsedPath.name, "_hydrateBundle.jsx");

            // const hydrateBundleFileContent = (await fs.promises.readFile(path.resolve(__dirname, "../util/react/client-hydrate-file-model.jsx"), "utf-8"))
            //     .replace("$file", this.file.replaceAll("\\", "/"));

            // await fs.promises.writeFile(hydrateBundleFile, hydrateBundleFileContent);

            // require("webpack")({
            //     entry: hydrateBundleFile,
            //     output: {
            //         path: path.join(parsedPath.dir, parsedPath.name),
            //         filename: "_bundle.js"
            //     },
            //     module: {
            //         rules: [
            //             {
            //                 test: /\.jsx?$/,
            //                 exclude: "/node_modules/",
            //                 use: {
            //                     loader: "babel-loader",
            //                     options: {
            //                         presets: [ "@babel/preset-react" ]
            //                     }
            //                 }
            //             }
            //         ]
            //     },
            //     resolve: {
            //         extensions: [ ".js", ".jsx" ]
            //     },
            //     mode: "development"
            // }, (err, stat) => { console.log(err ?? stat) });
            return ReactDOMServer.renderToString(React.createElement(ScreenDocument, parameters, await this.content()(parameters)));
        }

        static Client = class ReactClientPage {}
        // implementação futura com webpack
        // utilizará caminhos, path e path/bundle.js (como padrão, poderá ser reconfigurado)
        // precisará da implementação de um componente padrão de Document aqui antes
    }

    static _Placeholder = class PlaceholderPage extends Page {
        // usada pra chamar eventos e criar "páginas" sem necessitar de um arquivo e outras configurações.
        // não deve ser usado em grande escala.
        constructor(executor = async () => {}) {
            super("/", __filename);

            this._executor = executor;
            protect(this);
        }

        _executor;

        async process(parameters) {
            return await this._executor(parameters);
        }
    }



    static Router = class PageRouter extends Map {
        constructor() {
            super();
            protect(this);
        }

        events = {}

        _pagesInstances = new ProtectedSet();

        set() { throw new TypeError("PageRouter doesn't use the set method. Add pages via PageRouter.add()"); }

        add(page) {
            if (page instanceof Page) {
                const validatedPaths = [];
                for (const path of page.paths) {
                    let exists = false;
                    for (const registeredPage of this._pagesInstances.values()) {
                        if (registeredPage.match(path.name)) {
                            console.error(`PageRouter already has a page registered at ${path.name}`);
                            exists = true;
                            break;
                        }
                    }
                    if (exists) continue;
                    validatedPaths.push(path);
                }
                if (validatedPaths.length > 0) {
                    this._pagesInstances.add(page, ProtectedSetPermissionKey);
                    for (const path of validatedPaths) {
                        super.set(path.name, page);
                    }
                    for (const dependency of page.dependencies.values()) {
                        this.add(dependency);
                    }
                }
            } else {
                throw new TypeError("PageRouter only accepts Page instances");
            }
        }

        delete(page) {
            if (typeof page === "string") page = this.match(page);
            if (page instanceof Page) {
                for (const path of page.paths) {
                    super.delete(path.name);
                }
                this._pagesInstances.delete(page, ProtectedSetPermissionKey);
                for (const dependency of page.dependencies.values()) {
                    this.delete(dependency);
                }
            }
        }

        match(url) {
            let page = null;
            let params = null;

            for (const checkingPage of this._pagesInstances.values()) {
                params = checkingPage.match(url);
                if (params) {
                    page = checkingPage;
                    break;
                }
            }

            return [ page, params ];
        }
    }
    
    static Content = class PageContent {
        before = [];
        body = [];
        after = [];

        contentType;

        append(chunk, area) {
            if (!chunk) return;
            switch (area) {
                case "before":
                    this.before.push(chunk);
                    break;
                case "after":
                    this.after.push(chunk);
                    break;
                case "body":
                default:
                    this.body.push(chunk);
                    break;
            }
        }

        clear(area) {
            switch (area) {
                case "before":
                    this.before.length = 0;
                    break;
                case "after":
                    this.after.length = 0;
                    break;
                case "body":
                    this.body.length = 0;
                    break;
                default:
                    this.before.length = 0;
                    this.body.length = 0;
                    this.after.length = 0;
                    break;
            }
        }

        write(response, page) {
            if (page?._type === "asset") return;
            if (this.contentType) response.setHeader("Content-Type", this.contentType);
            for (const chunk of this.before) { response.write(chunk) }
            for (const chunk of this.body) { response.write(chunk) }
            for (const chunk of this.after) { response.write(chunk) }
        }
    }

    static {
        this.prototype._type = "abstract";
        this.Screen.prototype._type = "screen";
        this.Asset.prototype._type = "asset";
        this.Executable.prototype._type = "executable";
        this.Rest.prototype._type = "rest";
        this.React.prototype._type = "react";
        this._Placeholder.prototype._type = "placeholder";

        this._PublicTypes = Object.freeze([ "screen", "asset", "executable", "rest", "react" ]);
        this._PublicTypesConstructors = {
            screen: this.Screen,
            asset: this.Asset,
            executable: this.Executable,
            rest: this.Rest,
            react: this.React,
        }

        protect(this);
        protect(this.prototype, Object.getOwnPropertyNames(this.prototype));
        protect(this.Screen);
        protect(this.Asset);
        protect(this.Executable);
        protect(this.Rest);
        protect(this.React);
    }
}

module.exports = Page;