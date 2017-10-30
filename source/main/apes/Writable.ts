import { Writer } from "./Writer";

/**
 * Represents an object that can be encoded.
 */
export interface Writable {
    /**
     * Writes this object using given writer.
     * 
     * @param writer Write target.
     */
    write(writer: Writer);
}

/**
 * An ECMAScript array that implements the APES Writable interface.
 */
export class WritableArray<T> extends Array<T> implements Writable {
    public write(writer: Writer) {
        writer.writeList(writer => this.forEach(item => writer.add(item)));
    }
}
