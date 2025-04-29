const React = require("react");

function Document({ lang = "pt-br", title = "Document", head, body, children }) {
    return (<html lang={lang}>
        { head ?? <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{title}</title>
        </head> }
        { body ?? <body> {children} </body> }
    </html>);
}

module.exports = Document;