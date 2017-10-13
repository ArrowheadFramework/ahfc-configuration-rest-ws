import * as apes from "../../main/apes";
import * as assert from "assert";
import * as stream from "stream";

export function writeAndCompare(writer: Writer, expected: Buffer | string) {
    const stream = new BufferStream(32);
    writer(stream);
    if (expected instanceof Buffer) {
        const actual = stream.asBuffer();
        if (expected.compare(actual) !== 0) {
            assert.fail(actual.toString("hex"), expected.toString("hex"));
        }
    } else {
        const actual = stream.toString();
        assert.equal(actual, expected);
    }
}

export type Writer = (writer: stream.Writable) => void;

class BufferStream extends stream.Writable {
    private buffer: Buffer;
    private cursor: number;

    public constructor(capacity: number) {
        super({
            decodeStrings: true,
        });
        this.buffer = Buffer.alloc(capacity);
        this.cursor = 0;
    }

    public asBuffer(): Buffer {
        return this.buffer.slice(0, this.cursor);
    }

    public capcity(): number {
        return this.buffer.length;
    }

    public size(): number {
        return this.cursor;
    }

    public toString(encoding?: string, start?: number, end?: number): string {
        return this.buffer
            .slice(0, this.cursor)
            .toString(encoding, start, end);
    }

    public _write(chunk: Buffer, encoding: string, callback: Function): void {
        if (this.cursor + chunk.length > this.buffer.length) {
            const newLength = Math.max(
                align4096(this.cursor + chunk.length),
                this.buffer.length + this.buffer.length / 2
            );
            const newBuffer = Buffer.alloc(newLength);
            this.buffer.copy(newBuffer, 0, 0, this.cursor);
            this.buffer = newBuffer;
        }
        this.cursor += chunk.copy(this.buffer, this.cursor);
        callback();
    };
}

function align4096(x: number) {
    return (x + 4096 - 1) & -4096;
}