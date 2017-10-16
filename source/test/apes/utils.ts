import * as apes from "../../main/apes";
import * as assert from "assert";
import * as io from "../../main/io";
import * as stream from "stream";

export function readAndCompare(reader: Reader, expected: Buffer | string) {

}

export type Reader = (readable: stream.Readable) => void;

export function writeAndCompare(writer: Writer, expected: Buffer | string) {
    const writable = new io.WritableBuffer(32);
    writer(writable);
    if (expected instanceof Buffer) {
        const actual = writable.asBuffer();
        if (expected.compare(actual) !== 0) {
            assert.fail(actual.toString("hex"), expected.toString("hex"));
        }
    } else {
        const actual = writable.toString();
        assert.equal(actual, expected);
    }
}

export type Writer = (writable: stream.Writable) => void;
