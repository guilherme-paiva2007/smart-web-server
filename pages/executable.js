/** @type {import("../src/server").Page.ExecutablePageFunction} */
module.exports = function execute({ content, request }) {
    content.contentType = "text/plain";
    return request.method ?? "";
}