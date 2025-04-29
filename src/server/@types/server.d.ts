import http from "http"
import Page from "./page"
import Session from "./session"
import Component from "./component"

declare class Server extends http.Server {
    constructor(options: http.ServerOptions)

    pages: Page.Router
    sessions: Session.Collection
    components: Component.Collection
}

export = Server