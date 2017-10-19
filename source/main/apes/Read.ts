import * as io from "../io";
import * as stream from "stream";

/**
 * Represents an APES-compliant decoder function.
 *
 * A function with the signature is to turn a readable stream of bytes into an
 * ECMAScript object. The function only performs half of what could be
 * considered a full decoding, where the missing part is to turn the returned
 * object into a concrete class, or at least verify that it contains whatever
 * fields are expected.
 * 
 * @param source Source to decode.
 * @param limit Maximum number of bytes to read from source.
 * @return Promise of eventual decoding result.
 */
export type Read = (source: stream.Readable, limit?: number) => Promise<object>;

/**
 * APES compliant decoder functions.
 */
export const read = {
    JSON: (source: stream.Readable, limit = 4194304): Promise<object> => {
        return io.readAll(source, limit)
            .then(buffer => JSON.parse(buffer.toString("utf8")));
    }
};
