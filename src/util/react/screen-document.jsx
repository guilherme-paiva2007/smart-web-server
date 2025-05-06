const React = require("react");

const HeadTypes = [ "link", "meta", "title", "base", "style", "script" ];

const path = require("path");
const url = require("url");

function groupHeadAndBody(bodyChildren, headChildren, children) {
    let title;
    React.Children.forEach(children, child => {
        if (child.type === "head") {
            React.Children.forEach(child.props.children, headChild => {
                if (headChild.type === "title") {
                    title = headChild;
                } else {
                    headChildren.push(headChild);
                }
            });
        } else if (HeadTypes.includes(child.type)) {
            if (child.type === "title") {
                title = child;
            } else {
                headChildren.push(child);
            }
        } else if (child.type === React.Fragment) {
            let subMapResult = groupHeadAndBody(bodyChildren, headChildren, child.props?.children);
            if (subMapResult) title = subMapResult;
        } else {
            bodyChildren.push(child);
        }
    });
    return title;
}

function Document({ lang = "pt-br", request, children }) {
    const bodyChildren = [];
    const headChildren = [];

    const title = groupHeadAndBody(bodyChildren, headChildren, children);
    // const parsedUrl = url.parse(request.url);
    // const bundlePath = path.join(parsedUrl.pathname, "bundle.js").replaceAll("\\", "/");

    return (<html lang={lang}>
        <head>
            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            { title ?? <title>Document</title> }
            { headChildren }
        </head>
        <body>
            <div id="root">
                { bodyChildren }
            </div>
            {/* <script src={bundlePath}></script>
            {bundlePath} */}
        </body>
    </html>);
}

module.exports = Document;