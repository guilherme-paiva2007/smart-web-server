/** @type {import("../src/server").Page.ExecutablePageFunction} */
module.exports = function execute({ request }) {
    return request.method && "unknown method";
}