import Cookie from "./@types/cookie"
import protect from "./@types/protect"
import requireJSX from "./@types/require-jsx"
import timestamp from "./@types/timestamp"

declare namespace Util {
    export { Cookie }
    export { protect }
    export { requireJSX }
    export { timestamp }
}

export = Util