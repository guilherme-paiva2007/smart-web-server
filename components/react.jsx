const React = require("react");

module.exports = function component(p1, p2) {
    console.log("react component with", Object.keys(p1), Object.keys(p2));

    return (<>
        <p style={{ textDecorationLine: "underline" }}>{Date()}</p>
    </>);
}