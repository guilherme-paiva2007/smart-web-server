/**
 * @typedef {import("http").ServerResponse} ServerResponse
 */

const DEFAULT_CODE_MESSAGES={
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    408: "Request Timeout",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout"
};

class CodedError extends Error{
    /**
     * @param {ServerResponse} response 
     * @param {string} message 
     * @param {ErrorOptions} options
     */
    constructor(response,message,options) {
        super(message,options);
        if(response)response.statusCode=this.code;
        if(!message)this.message=DEFAULT_CODE_MESSAGES[this.code]||"Unknown Error";
    }
}

function createCodedError(name,defaultCode){
    let c = Object.values({[`${name}Error`]:class extends CodedError{}})[0];
    Object.defineProperty(c.prototype,"name",{value:`${name}Error`});
    Object.defineProperty(c.prototype,"code",{value:defaultCode});
    return function(response,message,options){return new c(response,message,options)};
}

module.exports = {
    ClientError:createCodedError("Client",400),
    AuthenthicationError:createCodedError("Authenthication",401),
    PermisionError:createCodedError("Permision",403),
    NotFoundError:createCodedError("NotFound",404),
    MethodError:createCodedError("Method",405),
    ServerError:createCodedError("Server",500),
    ImplementationError:createCodedError("Implementation",501),
    ServiceError:createCodedError("Service",503),
    TimeoutError:createCodedError("Timeout",504),
}

module.exports.ClientError();