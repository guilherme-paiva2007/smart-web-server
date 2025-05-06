const React = require("react");

function MyComponent() {
    return <p>{new Date().toString()}</p>
}

module.exports = function component({  }) {
    function print() {
        console.log(document.getElementById("input").value);
    }

    return (<>
        <head>
            <title>Oi</title>
        </head>
        <MyComponent/>
        <MyComponent/>
        <MyComponent/>
        <MyComponent/>
        <div style={{ backgroundColor: "#06a6ff", width: 100, height: 100, opacity: 0.5, position: "relative" }}></div>
        <div style={{ backgroundColor: "#ff0629", width: 100, height: 100, zIndex: 3, opacity: 0.5, transform: "translate(0%, -50%)" }}></div>
        
        <div style={{ backgroundColor: "#ff0629", width: 100, height: 100, zIndex: 3, opacity: 0.5 }}></div>
        <div style={{ backgroundColor: "#06a6ff", width: 100, height: 100, opacity: 0.5, position: "relative", transform: "translate(0%, -50%)"  }}></div>

        <div style={{ backgroundColor: "#f276fe", width: 100, height: 100, zIndex: 3 }}></div>
        <div style={{ backgroundColor: "#82568e", width: 100, height: 100, zIndex: 3, opacity: 0.5, transform: "translate(0%, -50%)" }}></div>
    </>);
}