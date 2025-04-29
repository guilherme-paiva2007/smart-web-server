import { IncomingMessage, ServerResponse } from "http"
import { CodedError } from "./errors"
import Server from "./server"
import http from "http"
import Session from "./session"
import Component from "./component"
import { ReadStream } from "fs"
import React from "react"

declare type ContentType =
    "text/html"|"text/plain"|"text/css"|"text/javascript"|
    "application/json"|"application/xml"|"application/octet-stream"|
    "image/png"|"image/jpeg"|"image/svg+xml"|"image/gif"|"image/webp"|
    "image/x-icon"|"image/vnd.microsoft.icon"|"image/vnd.wap.wbmp"|
    "image/bmp"|"image/tiff"|"image/x-xbitmap"|"image/vnd.djvu"|
    "image/x-portable-pixmap"|"image/x-portable-anymap"|"image/x-portable-bitmap"|
    "image/x-portable-graymap"

declare interface RequiredPageLoadParameters {
    server: Server
    request: IncomingMessage
    response: ServerResponse
    content: PageContent
    session: Session
    page: Page
}

declare interface ErrorPageLoadParameters extends RequiredPageLoadParameters {
    error: CodedError
}

declare interface PageLoadParameters extends RequiredPageLoadParameters {
    query?: object
    body?: Body
    params?: object
    localhooks?: object
}

declare type ExecutablePageFunction = (parameters: PageLoadParameters) => string

declare type EventsObject = {
    [name: string]: ExecutablePageFunction | ExecutablePageFunction[]
}

declare interface PageOptions {
    contentType?: ContentType
    events: EventsObject
}

declare interface PagePath {
    /** Caminho real. */
    name: string
    /** Expressão para testar caminhos especiais. */
    regexp: RegExp
    /** Nome dos parâmetros em ordem de aparição. */
    params: Readonly<string[]>
}


declare abstract class Page {
    constructor(paths: string | string[], file: string, options: PageOptions)

    paths: Readonly<PagePath>[]
    file: string
    contentType: ContentType
    events: Readonly<EventsObject>

    match(url: string): object | null

    abstract content(): any | Promise<any>
    abstract process(parameters: PageLoadParameters): Promise<any>

    load(parameters: PageLoadParameters): Promise<any>

    _emitEvent(eventName: string, parameters: PageLoadParameters): Promise<any>
}

type ScreenBuildParts = Readonly<(string | Component.BindedLoad)[]>

declare class ScreenPage extends Page {
    content(ComponentCollection?: Component.Collection): Promise<ScreenBuildParts>
    process(parameters: PageLoadParameters): Promise<string>
}

declare class ExecutablePage extends Page {
    content(): ExecutablePageFunction
    process(parameters: PageLoadParameters): Promise<string | undefined>
}

declare class AssetPage extends Page {
    content(): ReadStream
    process(parameters: PageLoadParameters): Promise<undefined>
}

declare type RestHandlersObject = {
    get?: ExecutablePageFunction
    post?: ExecutablePageFunction
    put?: ExecutablePageFunction
    delete?: ExecutablePageFunction
    patch?: ExecutablePageFunction
}

declare class RestPage extends Page {
    content(): RestHandlersObject
    process(parameters: PageLoadParameters): Promise<object | undefined>
}

declare class ReactPage extends Page {
    content(): () => React.ReactElement
    process(parameters: PageLoadParameters): Promise<string>
}

type PageContentArea = "before" | "body" | "after"

declare class PageContent {
    body: []
    before: []
    after: []

    contentType: ContentType | undefined

    append(chunk: any, area?: PageContentArea): void

    clear(area?: PageContentArea): void

    write(response: http.ServerResponse): void
}

declare class PageRouter extends Map<string, Page> {
    events: EventsObject

    private _pageInstances: Set<Page>

    private set(): void

    add(page: Page): void

    delete(page: Page): void

    match(url: string): [ Page, object ] | [ null, null ]
}

declare namespace Page {
    export { ExecutablePageFunction, PageLoadParameters, RequiredPageLoadParameters, ErrorPageLoadParameters, PageOptions, PagePath, ContentType, RestHandlersObject, ScreenBuildParts }
    export { PageContent as Content }
    export { PageRouter as Router }
    export { ScreenPage as Screen }
    export { ExecutablePage as Executable }
    export { AssetPage as Asset }
    export { RestPage as Rest }
    export { ReactPage as React }
}

export = Page