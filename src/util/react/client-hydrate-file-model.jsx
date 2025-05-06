const { hydrateRoot } = require("react-dom/client");
const Screen = require("$file");

hydrateRoot(
    document.getElementById("root"),
    <Screen />
)