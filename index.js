const chalk = require("chalk");
const { Server, Page, Cache, Component, Watcher } = require("./src/server/");
const path = require( "path" );
const { hostname, port } = require("./config.json").server;

const server = new Server();
console.clear();

server.on("listening", () => {
    console.log(`HTTP Server listening at ${chalk.blueBright("http://" + hostname + ":" + port + "/")}`);
});

server.pages.events.error = [ function({ error, content }) {
    content.clear();
    content.append(`${error?.name ?? "Error"} (${error?.code ?? 500}): ${error?.message}`);
    console.log(error);
} ];

// server.components.add(new Component.Screen("screen", path.join(__dirname, "components", "componente.html")));
// server.components.add(new Component.Executable("exect", path.join(__dirname, "components", "componenteExec.js")));
// server.components.add(new Component.React("react", path.join(__dirname, "components", "componenteReact.jsx")));

function loadContent() {
    if (!Cache.enabled) delete require.cache[require.resolve("./config.json")];
    const { pages, components, events } = require("./config.json").server;
    for (const [ dir, handlerConfigs ] of Object.entries(pages)) {
        server.watchPages(path.join(__dirname, dir), handlerConfigs);
    }
    for (const [ dir, handlerConfigs ] of Object.entries(components)) {
        server.watchComponents(path.join(__dirname, dir), handlerConfigs);
    }
    for (const [ dir, handlerConfigs ] of Object.entries(events)) {
        server.watchEvents(path.join(__dirname, dir), handlerConfigs);
    }
}

Cache.enabled = false;

server.listen(port, hostname);

loadContent();

process.stdin.on("data", data => {
    data = data.toString("utf-8").replace("\r\n", "");
    if (data.startsWith("routes")) {
        console.table([...server.pages.entries()].map(([ pagepath, page ]) => ({
            path: pagepath, file: path.relative(__dirname, page.file), type: page._type, contentType: page.contentType, events: Object.keys(page.events)
        })));
        return;
    }
    if (data.startsWith("watchers")) {
        console.log([...server.watchers.values()]);
        return;
    }
    if (data.startsWith("components")) {
        console.table([...server.components.values()].map(c => ({ name: c.name, file: path.relative(__dirname, c.file), type: c._type })));
        return;
    }
    if (data.startsWith("events")) {
        // console.table([...])
    }
});