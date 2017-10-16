import * as stream from "stream";

/**
 * A writable stream, storing any written data into a dynamically expanding
 * buffer.
 */
export class WritableBuffer extends stream.Writable {
    private buffer: Buffer;
    private cursor: number;

    /**
     * Creates new writable buffer.
     * 
     * @param capacity Initial internal capacity, in bytes.
     */
    public constructor(capacity: number = 256) {
        super({
            decodeStrings: true,
        });
        this.buffer = Buffer.alloc(capacity);
        this.cursor = 0;
    }

    /**
     * Returns contents of writable as buffer containing only written bytes.
     * 
     * Note that the returned buffer is a pointer to the internal buffer of
     * this writable stream. Any changes made to it will also change the
     * internal buffer.
     */
    public asBuffer(): Buffer {
        return this.buffer.slice(0, this.cursor);
    }

    /**
     * Current maximum capacity of internal buffer, in bytes.
     */
    public capacity(): number {
        return this.buffer.length;
    }

    /**
     * Amount of bytes currently written to internal buffer, in bytes.
     */
    public size(): number {
        return this.cursor;
    }

    /**
     * Copies internal buffer into string object.
     * 
     * @param encoding String encoding to use when decoding internal buffer. If
     * not specified, then UTF-8 will be used.
     * @param start Offset of internal buffer where string decoding is to start.
     * @param end Offset of internal buffer where string decoding is to stop.
     */
    public toString(encoding?: string, start?: number, end?: number): string {
        return this.buffer
            .slice(0, this.cursor)
            .toString(encoding, start, end);
    }

    /**
     * @private 
     */
    public _write(chunk: Buffer, encoding: string, callback: Function): void {
        if (this.cursor + chunk.length > this.buffer.length) {
            let newLength = Math.max(
                this.cursor + chunk.length,
                this.buffer.length + this.buffer.length / 2
            );
            if (newLength < 4096) {
                newLength = align64(newLength);
            } else {
                newLength = align4096(newLength);
            }
            const newBuffer = Buffer.alloc(newLength);
            this.buffer.copy(newBuffer, 0, 0, this.cursor);
            this.buffer = newBuffer;
        }
        this.cursor += chunk.copy(this.buffer, this.cursor);
        callback();
    };
}

function align64(x: number) {
    return (x + 64 - 1) & -64;
}

function align4096(x: number) {
    return (x + 4096 - 1) & -4096;
}