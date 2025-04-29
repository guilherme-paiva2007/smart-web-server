const chalk = require("chalk");
const { Server, Page, Cache, Component, Watcher } = require("./src/server/");
const path = require( "path" );
const { hostname, port, pages } = require("./config.json").server;

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

server.components.add(new Component.Screen("screen", path.join(__dirname, "components", "componente.html")));
server.components.add(new Component.Executable("exect", path.join(__dirname, "components", "componenteExec.js")));
server.components.add(new Component.React("react", path.join(__dirname, "components", "componenteReact.jsx")));

new Watcher(path.join(__dirname, "pages"), 
    new Watcher.Handler.Page({ extensions: [ ".html" ] }, "screen", server.pages),
    new Watcher.Handler.Page({ extensions: [ ".js" ] }, "executable", server.pages),
    new Watcher.Handler.Page({ extensions: [ ".jsx" ] }, "react", server.pages),
);

new Watcher(path.join(__dirname, "assets"),
    new Watcher.Handler.Page({ }, "asset", server.pages, { extension: true }),
);

new Watcher(path.join(__dirname, "apis"),
    new Watcher.Handler.Page({ extensions: [ ".js" ] }, "rest", server.pages),
);
// new Watcher.Handler.Component()

Cache.enabled = false;

server.listen(port, hostname);

process.stdin.on("data", data => {
    data = data.toString("utf-8").replace("\r\n", "");
    if (data.startsWith("routes")) {
        console.table([...server.pages.entries()].map(([ path, page ]) => ({ path, file: page.file, type: page._type })));
    }
});