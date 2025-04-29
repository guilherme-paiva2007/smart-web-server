const { ClientError } = require( "../src/server" );

module.exports = {
    async get({ server, params, response }) {
        const pages = [ ...server.pages.keys() ]
        if (params.index) {
            if (isNaN(parseInt(params.index))) throw ClientError(response, "Index must be a number");
            const page = pages[params.index];
            return page ?? "";
        }
        return pages;
    },
    async post({ body }) {
        return body.content;
    }
}