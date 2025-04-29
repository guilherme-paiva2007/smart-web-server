import { RequiredPageLoadParameters } from "./page"

/**
 * Cria um novo evento no registro.
 */
declare class Event {
    constructor(name: string, callback: () => any)

    name: string
    callback: (parameters: RequiredPageLoadParameters) => any
}

/**
 * Procura por um evento já existente por seu nome registrado.
 * @param name 
 */
declare function Event(name: string): Event

declare namespace Event {
    /**
     * Remove um evento do registro.
     * @param name 
     */
    function remove(name: string): Event | undefined
}

export = Event