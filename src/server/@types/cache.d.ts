declare class Cache extends Map<any, any> {
    get(key: any): any
    set(key: any, value: any): this
    has(key: any): boolean

    static get enabled(): boolean
    static set enabled(value): void
}

export = Cache