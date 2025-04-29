import { ServerResponse } from "http"

declare namespace Errors {
    abstract class CodedError extends Error {
        constructor(response: ServerResponse, message?: string, options: ErrorOptions)

        code: number
    }
    /** Erro genérico relacionado a ações do cliente. */
    class ClientError extends CodedError {}
    function ClientError(response: ServerResponse, message?: string, options: ErrorOptions): ClientError
    /** Erro genérico relacionado a processos do servidor. */
    class ServerError extends CodedError {}
    function ServerError(response: ServerResponse, message?: string, options: ErrorOptions): ServerError
    /** Erro relacionado a autenticação. */
    class AuthenticationError extends CodedError {}
    /** Erro relacionado a permissões. */
    class PermissionError extends CodedError {}
    /** Erro relacionado a recurso não encontrado. */
    class NotFoundError extends CodedError {}
    /** Erro relacionado a método inválido ou não permitido. */
    class MethodError extends CodedError {}
    /** Erro relacionado a falha ou indisponibilidade de um serviço. */
    class ServiceError extends CodedError {}
    /** Erro relacionado a tempo limite excedido de resposta do servidor. */
    class TimeoutError extends CodedError {}
    /** Erro relacionado a falha na implementação. */
    class ImplementationError extends CodedError {}
}

export = Errors