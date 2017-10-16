import * as io from "../io";
import { Reader } from "./Reader";
import * as stream from "stream";

/**
 * A JSON stream reader.
 */
export class ReaderJSON implements Reader {
    /**
     * Creates new UTF-8 JSON stream reader.
     *
     * @param source Source of JSON data.
     * @param limit Maximum amount of bytes to read from stream.
     */
    public constructor(
        private readonly source: stream.Readable,
        private readonly limit = 4194304,
    ) { }

    read(): Promise<object> {
        return io
            .readAll(this.source, this.limit)
            .then(buffer => JSON.parse(buffer.toString("utf8")));
    }
}