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
        this.buffer = Buffer.alloc(alignSize(capacity));
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
     * Copies bytes written to internal buffer and returns the copy.
     */
    public copyBuffer(): Buffer {
        const buffer = Buffer.allocUnsafe(this.size());
        this.buffer.copy(buffer, 0, 0, this.size());
        return buffer;
    }

    /**
     * Amount of bytes currently written to internal buffer, in bytes.
     */
    public size(): number {
        return this.cursor;
    }

    /**
     * Copies internal buffer, resets it, and returns copy.
     */
    public pop(): Buffer {
        const buffer = this.copyBuffer();
        this.reset();
        return buffer;
    }

    /**
     * Resets buffer, causing any subsequent writes to be performed from the
     * beginning of the internal buffer.
     *
     * If a capacity is provided, the internal buffer may be reduced in size if
     * that capacity is smaller than the current capacity.
     *
     * @param capacity New internal buffer capacity, if any.
     */
    public reset(capacity?: number) {
        if (capacity) {
            capacity = alignSize(capacity);
            if (this.buffer.length > capacity) {
                this.buffer = Buffer.alloc(capacity);
            }
        }
        this.buffer.fill(0, 0, this.cursor);
        this.cursor = 0;
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
            let newLength = alignSize(Math.max(
                this.cursor + chunk.length,
                this.buffer.length + this.buffer.length / 2
            ));
            const newBuffer = Buffer.alloc(newLength);
            this.buffer.copy(newBuffer, 0, 0, this.cursor);
            this.buffer = newBuffer;
        }
        this.cursor += chunk.copy(this.buffer, this.cursor);
        callback();
    };
}

function alignSize(x: number): number {
    return x < 4096
        ? (x + 64 - 1) & -64
        : (x + 4096 - 1) & -4096;
}
