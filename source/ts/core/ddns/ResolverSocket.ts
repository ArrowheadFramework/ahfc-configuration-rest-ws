import { RCode } from "./constants";
import { Reader, Writer } from "./io";
import { Message } from "./Message";
import * as net from "net";
import { ResolverError, ResolverErrorCode } from "./Resolver";

/**
 * A DNS resolver TCP socket.
 * 
 * Maintains a TCP socket, a queue of outbound DNS messages, and a set of
 * inbound, or expected, messages.
 */
export class ResolverSocket {
    public readonly address: string;

    private readonly keepOpenForMs: number;
    private readonly port: number;
    private readonly timeoutInMs: number;

    private closer: NodeJS.Timer;
    private connected: boolean;
    private inbound: Map<number, Task>;
    private outbound: Array<Task>;
    private socket: net.Socket;

    /**
     * Creates new DNS resolver TCP socket.
     * 
     * @param address IP address of DNS server.
     * @param options Any socket options.
     */
    public constructor(address: string, options: ResolverSocketOptions = {}) {
        this.keepOpenForMs = options.keepOpenForMs || 3000;
        this.port = options.port || 53;
        this.timeoutInMs = options.timeoutInMs || 10000;

        this.address = address;
        this.closer = undefined;
        this.connected = false;
        this.outbound = [];
        this.inbound = new Map();
    }

    /**
     * Attempts to send DNS message to DNS server.
     * 
     * @param request Message to send.
     */
    public send(request: Message): Promise<Message> {
        return new Promise((resolve, reject) => {
            this.outbound.push({ request, resolve, reject });
            this.poll();
        });
    }

    private poll() {
        if (!this.socket) {
            this.connect();
            return;
        }
        if (!this.connected) {
            return;
        }
        this.deferTryClose();

        // Transmit outbound (unsent) messages.
        {
            const lengthBuffer = Buffer.alloc(2);
            this.outbound.forEach(task => {
                if (this.inbound.has(task.request.id)) {
                    task.reject(new ResolverError(
                        ResolverErrorCode.RequestIDInUse,
                        task.request
                    ));
                    return;
                }
                const length = task.request.length();
                if (length > 65535) {
                    task.reject(new ResolverError(
                        ResolverErrorCode.RequestTooLong,
                        task.request
                    ));
                    return;
                }
                const requestBuffer = Buffer.alloc(length);
                task.request.write(requestBuffer);

                lengthBuffer.writeUInt16BE(length, 0);
                this.socket.write(lengthBuffer);
                this.socket.write(requestBuffer);

                this.inbound.set(task.request.id, task);
            });
            this.outbound = [];
        }
    }

    private connect() {
        this.socket = new net.Socket();
        this.socket.setTimeout(this.timeoutInMs);

        // Handle connection status events.
        {
            this.socket.on("close", hadError => {
                this.connected = false;
                this.socket = undefined;
                if (this.inbound.size > 0 || this.outbound.length > 0) {
                    this.poll();
                }
            });
            this.socket.on("connect", () => {
                this.connected = true;
                this.poll();
            })
            this.socket.on("error", error => {
                error = new ResolverError(
                    ResolverErrorCode.Other,
                    undefined,
                    undefined,
                    error
                );
                this.connected = false;
                this.inbound.forEach(task => task.reject(error));
                this.inbound.clear();
                this.outbound.forEach(task => task.reject(error));
                this.outbound = [];
                this.socket = undefined;
            });
            this.socket.on("timeout", () => {
                this.socket.end();
            });
        }

        // Handle connection transmission events.
        {
            let receiveBuffer: Buffer = Buffer.alloc(2);
            let bytesExpected: number = undefined;
            let bytesReceived: number = 0;

            let onLengthData: (chunk: Buffer) => void;
            let onMessageData: (chunk: Buffer) => void;

            onLengthData = (chunk: Buffer) => {
                let offset;
                if (bytesReceived === 0 && chunk.length >= 2) {
                    receiveBuffer = chunk;
                    bytesReceived = offset = 2;
                } else {
                    offset = chunk.copy(receiveBuffer, 0, 0, 2 - bytesReceived);
                    bytesReceived += offset;
                }
                if (bytesReceived === 2) {
                    bytesExpected = receiveBuffer.readUInt16BE(0);

                    chunk = chunk.slice(offset);
                    if (chunk.length >= bytesExpected) {
                        receiveBuffer = chunk.slice(0, bytesExpected);
                        bytesReceived = bytesExpected;
                        chunk = chunk.slice(bytesExpected);
                    } else {
                        receiveBuffer = Buffer.alloc(bytesExpected);
                        bytesReceived = 0;
                    }
                    this.socket.removeListener("data", onLengthData);
                    this.socket.addListener("data", onMessageData);
                    onMessageData(chunk);
                }
            };
            onMessageData = (chunk: Buffer) => {
                const bytesRemaining = bytesExpected - bytesReceived;
                if (bytesRemaining > 0) {
                    bytesReceived += chunk.copy(receiveBuffer, bytesRemaining);
                    chunk = chunk.slice(bytesRemaining);
                }
                if (bytesRemaining <= 0) {
                    bytesExpected = undefined;
                    bytesReceived = 0;
                    try {
                        const response = Message.read(receiveBuffer);
                        const task = this.inbound.get(response.id);
                        if (task) {
                            this.inbound.delete(response.id);
                            task.resolve(response);
                        } else {
                            this.socket.destroy(new ResolverError(
                                ResolverErrorCode.ResponseIDUnexpected
                            ));
                            return;
                        }
                    } catch (error) {
                        this.socket.destroy(error);
                        return;
                    }
                    this.socket.removeListener("data", onMessageData);
                    this.socket.addListener("data", onLengthData);
                    if (chunk.length > 0) {
                        onLengthData(chunk);
                    }
                }
            };
            this.socket.addListener("data", onLengthData);
        }

        this.socket.connect(this.port, this.address);
    }

    private deferTryClose() {
        if (this.closer !== undefined) {
            clearTimeout(this.closer);
        }
        this.closer = setTimeout(() => {
            this.closer = undefined;
            if (!this.tryClose()) {
                this.deferTryClose();
            }
        }, this.keepOpenForMs);
    }

    private tryClose(): boolean {
        if (this.inbound.size === 0 && this.outbound.length === 0) {
            if (this.socket) {
                this.socket.end();
            }
            return true;
        }
        return false;
    }
}

interface Task {
    request: Message,
    resolve: (response: Message) => void;
    reject: (error: Error) => void;
}

/**
 * `ResolverSocket` options.
 */
export interface ResolverSocketOptions {
    /**
     * Time to keep socket open after successfully sending and receiving, in
     * milliseconds.
     * 
     * Defaults to 3000 (3 seconds). Most DNS servers would be expected to close
     * a lingering connection after 20 seconds of inactivity, as suggested by
     * RFC 1035.
     */
    readonly keepOpenForMs?: number;

    /**
     * Socket timeout, in milliseconds.
     * 
     * If a period of inactivity while sending or receiving data via the socket
     * exceeds the given timeout, any outstanding messages are rejected with
     * a timeout error.
     * 
     * Defaults to 10000 (10 seconds). 
     */
    readonly timeoutInMs?: number;

    /**
     * DNS server port number.
     * 
     * Defaults to 53.
     */
    readonly port?: number;
}
