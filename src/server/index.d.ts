import Server from "./@types/server";
import Page from "./@types/page";
import Session from "./@types/session";
import Component from "./@types/component";
import Cache from "./@types/cache";
import Event from "./@types/event"
import Watcher from "./watcher";
import { AuthenticationError, ClientError, MethodError, NotFoundError, PermissionError, ServerError, ServiceError, TimeoutError, ImplementationError } from "./@types/errors";

declare namespace SmartWeb {
    export { Server, Page, Session, Component, Cache, Event, Watcher };
    export { AuthenticationError, ClientError, MethodError, NotFoundError, PermissionError, ServerError, ServiceError, TimeoutError, ImplementationError };
}

export = SmartWeb