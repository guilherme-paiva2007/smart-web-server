/**
 * Protege o objeto contra manipulações das propriedades existentes.
 * @param object 
 * @param keys Se vazio, aplicará em todas as chaves visíveis. (Iniciadas em _ serão ocultas)
 */
declare function protect(object: object, keys?: string[]): void

export = protect