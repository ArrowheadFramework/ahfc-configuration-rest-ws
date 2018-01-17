import * as apes from "./apes";
import * as http from "http";
import * as io from "./io";
import * as stream from "stream";
import * as url from "url";

/**
 * An HTTP response code.
 */
export enum Code {
    Continue = 100,
    SwitchingProtocols = 101,

    OK = 200,
    Created = 201,
    Accepted = 202,
    NonAuthoritativeInformation = 203,
    NoContent = 204,
    ResetContent = 205,
    PartialContent = 206,

    MultipleChoices = 300,
    MovedPermanently = 301,
    Found = 302,
    SeeOther = 303,
    NotModified = 304,
    UseProxy = 305,
    TemporaryRedirect = 307,
    PermanentRedirect = 308,

    BadRequest = 400,
    Unauthorized = 401,
    PaymentRequired = 402,
    Forbidden = 403,
    NotFound = 404,
    MethodNotAllowed = 405,
    NotAcceptable = 406,
    ProxyAuthenticationRequired = 407,
    RequestTimeout = 408,
    Conflict = 409,
    Gone = 410,
    LengthRequired = 411,
    PreconditionFailed = 412,
    PayloadTooLarge = 413,
    RequestURITooLong = 414,
    UnsupportedMediaType = 415,
    RequestedRangeNotSatisfiable = 416,
    ExpectationFailed = 417,
    ImaTeapot = 418,

    InternalServerError = 500,
    NotImplemented = 501,
    BadGateway = 502,
    ServiceUnavailable = 503,
    GatewayTimeout = 504,
    HTTPVersionNotSupported = 505,
    BandwidthLimitExceeded = 509,
}

/**
 * An HTTP request method.
 */
export enum Method {
    CONNECT,
    DELETE,
    GET,
    HEAD,
    OPTIONS,
    PATCH,
    POST,
    PUT,
    TRACE,
}

/**
 * An HTTP request, as given to a route handler.
 */
export interface Request {
    readonly method: Method;
    readonly path: string;
    readonly parameters: { [name: string]: string };
    readonly headers: { [name: string]: string };
    readonly body?: object;
}

/**
 * An HTTP response, as expected from a route handler.
 */
export interface Response {
    readonly code: Code;
    readonly reason: string;
    readonly headers?: { [name: string]: string };
    readonly body?: apes.Writable;
}

/**
 * An HTTP route.
 */
export interface Route {
    method: Method;
    path: string;
    handler: (
        parameters: { [name: string]: string },
        headers: { [name: string]: string },
        body: object
    ) => PromiseLike<Response>;
}

/**
 * An HTTP server.
 */
export class Server {
    private readonly routeMap = new Map<string, Route>();

    /**
     * Registers new HTTP route.
     * 
     * @param route Route to register.
     * @return Self.
     */
    public handle(route: Route): Server {
        const key = toRouteMapKey(route.method, route.path);
        if (this.routeMap.has(key)) {
            throw new Error("Route already set for: " + key);
        }
        this.routeMap.set(key, route);
        return this;
    }

    /**
     * Finalizes HTTP route registration and starts to listen for incoming HTTP
     * requests.
     * 
     * @param port Port number to listen on.
     */
    public listen(port: number) {
        const server = http.createServer((request, out) => {
            const uridata = url.parse(request.url, true, true);
            const contentType = (request.headers["content-type"] || "").trim();
            const accept = (request.headers["accept"] || "*")
                .split(",")
                .map(mimeType => mimeType.trim());

            const data = {
                method: Method[request.method.trim().toUpperCase()],
                path: uridata.pathname as string,
                parameters: uridata.query as { [name: string]: string },
                headers: request.headers as { [name: string]: string },
                body: undefined,
            };

            let routePromise;
            if (contentType.length > 0) {
                const read = apes.MIME.decoderFor(contentType);
                if (!read) {
                    respond(accept, out, {
                        code: Code.UnsupportedMediaType,
                        reason: "Unsupported Media Type " + contentType
                    });
                    return;
                }
                routePromise = read(request).then(body => {
                    data.body = body;
                    return this.route(data);
                });
            } else {
                routePromise = this.route(data);
            }
            routePromise.then(
                response => respond(accept, out, response),
                error => {
                    respond(accept, out, {
                        code: Code.InternalServerError,
                        reason: "Internal Server Error",
                    });
                    console.log(error);
                });
        });
        server.listen(port);

        function respond(accept: string[], out, response: Response) {
            let write: apes.Write = null;
            let writeType: string = null;
            if (response.body) {
                for (const mimeType of accept) {
                    [write, writeType] = apes.MIME.encoderFor(mimeType);
                    if (write) {
                        break;
                    }
                }
                if (!write) {
                    out.statusCode = 415;
                    out.statusMessage = "Unsupported Media Type";
                    out.setHeader("content-type", "text/plain");
                    out.end("Given accept types match no supported encoders.");
                    return;
                }
            }
            out.statusCode = response.code;
            out.statusMessage = response.reason;
            if (response.headers) {
                Object.getOwnPropertyNames(response.headers).forEach(name => {
                    const value = response.headers[name];
                    out.setHeader(name, value);
                });
            }
            if (response.body) {
                out.setHeader("content-type", writeType);
                response.body.write(write(out));
            }
            out.end();
        }
    }

    protected route(request: Request): PromiseLike<Response> {
        const key = toRouteMapKey(request.method, request.path);
        const route = this.routeMap.get(key);
        if (!route) {
            return Promise.resolve({
                code: Code.NotFound,
                reason: "Not found"
            } as Response);
        }
        return route.handler(
            request.parameters,
            request.headers,
            request.body
        );
    }
}

function toRouteMapKey(method: Method, path: string): string {
    return method + " " + (path.startsWith("/") ? "" : "/") + path +
        (path.endsWith("/") ? "" : "/")
}