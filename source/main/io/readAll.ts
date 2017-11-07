import * as stream from "stream";
import { WritableBuffer } from "./WritableBuffer";

/**
 * Reads entire readable stream into buffer.
 * 
 * @param r Stream to read.
 * @param limit Limit, in bytes, at which given stream is closed and the
 * returned promise rejected due to the read stream being too large. If
 * rejected due to being too large, the provided error is of type RangeError.
 * @return Promise of eventual read completion.
 */
export function readAll(r: stream.Readable, limit?: number): Promise<Buffer> {
    let sink = new WritableBuffer();
    return new Promise((resolve, reject) => {
        r.on("readable", () => {
            const chunk = r.read() as Buffer;
            if (chunk === null) {
                resolve(sink.asBuffer());
                return;
            }
            if (!(chunk instanceof Buffer || typeof chunk === "string")) {
                reject(new Error("Object streams not supported"));
                return;
            }
            if (limit && sink.size() + chunk.length > limit) {
                reject(new RangeError("Stream too large (>" + limit + ")"));
                return;
            }
            sink.write(chunk);
        });
    });
}