import { IncomingMessage, ServerResponse } from "http";

declare class Session extends Map<any, any> {
    constructor(collection: SessionCollection, response: ServerResponse, maxAge?: number)

    id: string
    /**
     * Marcador temporal de último uso da sessão em milissegundos.
     */
    lastUse: number
    /**
     * Idade máxima da sessão em minutos.
     */
    maxAge: number
}

declare class SessionCollection extends Map<string, Session> {
    constructor(name: string, cleaningInterval?: number)

    private set(): void

    name: string
    /**
     * Intervalo de limpeza em minutos.
     */
    cleaningInterval: number

    add(session: Session): void
}

declare namespace Session {
    export { SessionCollection as Collection }
}

declare function Session(collection: SessionCollection, request: IncomingMessage, response: ServerResponse, maxAge?: number): Session

export = Session