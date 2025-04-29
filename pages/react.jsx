const React = require("react");

const Document = require("../react-doc-body.jsx");

function MyComponent() {
    return <p>{new Date().toString()}</p>
}

module.exports = function component({  }) {
    return (<Document>
        <MyComponent />
        <test></test>
    </Document>);
}