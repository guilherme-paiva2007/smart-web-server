declare namespace Cookie {
    export function parse(cookieHeaderString: string): object

    export function stringify(cookieObject: object): string
}

export = Cookie