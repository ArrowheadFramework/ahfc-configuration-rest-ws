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