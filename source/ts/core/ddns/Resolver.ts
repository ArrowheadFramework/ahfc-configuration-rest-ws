import { DClass, OpCode, RCode, Type } from "./constants";
import * as dns from "dns";
import { Message } from "./Message";
import * as net from "net";
import { ResolverSocket } from "./ResolverSocket";
import { ResourceRecord } from "./ResourceRecord";
import * as rdata from "./ResourceData";

/**
 * A DNS resolver.
 */
export class Resolver {
    private readonly sockets: ResolverSocket[];

    public constructor(nameServerAddresses: string[] = dns.getServers()) {
        this.sockets = nameServerAddresses.map(a => new ResolverSocket(a));
    }

    // TODO: TSIG.

    /**
     * @param hostname Hostname to request PTR record targets of.
     */
    public resolvePTR(hostname: string): Promise<string[]> {
        return this
            .send(Message.newQuery(hostname, Type.PTR))
            .then(response => response.answers
                .map(answer => (answer.rdata as rdata.PTR).ptrdname));
    }

    /**
     * Requests PTR record targets of given hostnames. The returned promise is
     * only rejected if not a single record could be resolved.
     * 
     * @param hostnames Hostnames to request PTR record targets of.
     * @return Promise of eventual PTR record targets.
     */
    public resolvePTRs(hostnames: string[]): Promise<Array<string | Error>> {
        return this
            .sendAll(hostnames.map(hostname =>
                Message.newQuery(hostname, Type.PTR)))
            .then(responses => responses.reduce((targets, response) => {
                if (response instanceof Error) {
                    targets.push(response);
                    return targets;
                }
                return targets.concat(response.answers
                    .reduce((targets, answer, index) => {
                        targets[index] = (answer.rdata as rdata.PTR).ptrdname;
                        return targets;
                    }, new Array(response.answers.length)));
            }, new Array<string | Error>()));
    }

    public resolveSRV(hostname: string): Promise<rdata.SRV[]> {
        return this
            .send(Message.newQuery(hostname, Type.SRV))
            .then(response => response.answers
                .map(answer => answer.rdata as rdata.SRV));
    }

    public resolveTXT(hostname: string): Promise<rdata.TXT[]> {
        return this
            .send(Message.newQuery(hostname, Type.TXT))
            .then(response => response.answers
                .map(answer => answer.rdata as rdata.TXT));
    }

    public reverse(address: string): Promise<string[]> {
        return Resolver.addressToArpaName(address)
            .then(arpaName => this.resolvePTR(arpaName));

    }

    public reverseAll(addresses: string[]): Promise<Array<string | Error>> {
        return Promise
            .all(addresses.map(address => Resolver.addressToArpaName(address)))
            .then(arpaNames => this.resolvePTRs(arpaNames));
    }

    private static addressToArpaName(address: string): Promise<string> {
        return new Promise((resolve, reject) => {
            switch (net.isIP(address)) {
                case 4:
                    resolve(ipv4ToArpaName(address));
                    break;

                case 6:
                    resolve(ipv6ToArpaName(address));
                    break;

                default:
                    reject(new Error("Not an IP address: " + address));
                    break;
            }
        });

        function ipv4ToArpaName(address: string): string {
            return address.split(".").reverse().join(".") + ".in-addr.arpa";
        }

        function ipv6ToArpaName(address: string): string {
            let sections = address.split(":").slice(0, 8);
            let missing = (8 - sections.length);
            let indexOffset = 0;
            return sections
                .reduce((sections, section, index) => {
                    if (section.length === 0) {
                        do {
                            sections[index + indexOffset++] = "0000";
                        } while (--missing >= 0);
                    } else {
                        sections[index + indexOffset] =
                            "0000".substring(0, 4 - section.length) + section;
                    }
                    return sections;
                }, new Array<string>(8))
                .reduceRight((result, section) => result +=
                    section.charAt(3) + "." +
                    section.charAt(2) + "." +
                    section.charAt(1) + "." +
                    section.charAt(0) + ".", "") + "ip6.arpa";
        }
    }

    public send(request: Message): Promise<Message> {
        let error;
        let socketIndex = 0;
        const sockets = this.sockets;
        return new Promise((resolve, reject) => (function tryNextSocket() {
            if (socketIndex >= sockets.length) {
                if (!error) {
                    error = new ResolverError(
                        ResolverErrorCode.NoKnownNameServers,
                        request
                    );
                }
                reject(error);
                return;
            }
            sockets[socketIndex++]
                .send(request)
                .then(response => {
                    if (response.flags.rcode !== RCode.NOERROR) {
                        error = new ResolverError(
                            ResolverErrorCode.ResponseBad,
                            request,
                            response
                        );
                        tryNextSocket();
                    } else if (response.flags.opcode !== request.flags.opcode) {
                        error = new ResolverError(
                            ResolverErrorCode.ResponseNotExpected,
                            request,
                            response
                        );
                        tryNextSocket();
                    } else {
                        resolve(response);
                    }
                }, err => {
                    error = err;
                    tryNextSocket();
                });
        })());
    }

    public sendAll(requests: Message[]): Promise<Array<Message | Error>> {
        let countdown = requests.length;
        let successes = 0;
        const results: Array<Message | Error> = [];
        return new Promise((resolve, reject) => {
            requests.forEach(message => this.send(message).then(
                message => {
                    successes += 1;
                    push(message);
                },
                error => push(error)
            ));

            function push(result: Message | Error) {
                results.push(result);

                if (--countdown !== 0) {
                    return;
                }
                if (successes === 0) {
                    reject(new ResolverMultiError(results as Error[]));
                } else {
                    resolve(results);
                }
            }
        });
    }
}

/**
 * A `Resolver` `Error`.
 */
export class ResolverError extends Error {
    /**
     * Creates new error object.
     * 
     * @param code Error code.
     * @param request Request message, if any.
     * @param response Response message, if any.
     * @param cause Cause of error, if any.
     */
    public constructor(
        public readonly code: ResolverErrorCode,
        public readonly request?: Message,
        public readonly response?: Message,
        public readonly cause?: Error,
    ) {
        super(cause instanceof Error
            ? cause.message
            : response
                ? ("DNS error RCODE=" + response.flags.rcode)
                : "DNS error");
        this.name = (this as any).constructor.name;
    }
}

/**
 * Enumerates different kinds of `ResolverSocket` errors.
 */
export enum ResolverErrorCode {
    /**
     * There is no domain name server to send requests to. 
     */
    NoKnownNameServers,

    /**
     * Some other error caused the resolver to fail. See the `cause` field of
     * any associated `ResolverError` for more details.
     */
    Other,

    /**
     * Another inbound message held by socket uses the same message ID.
     */
    RequestIDInUse,

    /**
     * The provided message is longer than 65535 bytes, which is the largest
     * message size supported by DNS (RFC 1035).
     */
    RequestTooLong,

    /**
     * A sent message was never answered. If the message was sent over UDP it
     * was retried several times before this error was generated.
     */
    RequestUnanswered,

    /**
     * A DNS response message was received, but it is an error message. See the
     * `response` field of any associated `ResolverError` for more details.
     */
    ResponseBad,

    /**
     * A message was received from the remote host with an unexpected message
     * ID.
     */
    ResponseIDUnexpected,

    /**
     * A DNS response message was received, but was of an unexpected type. See
     * the `response` field of any associated `ResolverError` for more details.
     */
    ResponseNotExpected,
}

/**
 * Holds multiple `Resolver` `Error`s.
 */
export class ResolverMultiError extends Error {
    /**
     * Creates new error object.
     * 
     * @param errors Error code,
     */
    public constructor(
        public readonly errors: Error[] = []
    ) {
        super(errors.length === 1 ? errors[0].message : "DNS errors");
        this.name = (this as any).constructor.name;
    }
}
