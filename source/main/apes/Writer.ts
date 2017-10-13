import { Writable } from "./Writable";

/**
 * Represents an APES-compliant encoder.
 */
export interface Writer {
    /**
     * Writes list to encoder.
     * 
     * @param f Function to receive list writer.
     */
    writeList(f: (writer: WriterList) => void);

    /**
     * Writes map to encoder.
     * 
     * @param f Function to receive map writer.
     */
    writeMap(f: (writer: WriterMap) => void);
}

/**
 * Represents an APES-compliant list encoder.
 */
export interface WriterList {
    /**
     * Writes null to list.
     */
    addNull(): this;

    /**
     * Writes boolean to list.
     */
    addBoolean(value: boolean): this;

    /**
     * Writes number to list.
     * 
     * The number must be finite, or an exception is thrown.
     */
    addNumber(value: number): this;

    /**
     * Writes text to list.
     */
    addText(value: string): this;

    /**
     * Writes list to list.
     */
    addList(f: (writer: WriterList) => void): this;

    /**
     * Writes map to list.
     */
    addMap(f: (writer: WriterMap) => void): this;

    /**
     * Writes arbitrary writable object to list.
     */
    addWritable(value: Writable): this;
}

/**
 * Represents an APES-compliant map encoder.
 */
export interface WriterMap {
    /**
     * Writes null entry to map.
     */
    addNull(key: string): this;

    /**
     * Writes boolean entry to map.
     */
    addBoolean(key: string, value: boolean): this;

    /**
     * Writes number entry to map.
     * 
     * The number must be finite, or an exception is thrown.
     */
    addNumber(key: string, value: number): this;

    /**
     * Writes text entry to map.
     */
    addText(key: string, value: string): this;

    /**
     * Writes list entry to map.
     */
    addList(key: string, f: (writer: WriterList) => void): this;

    /**
     * Writes map entry to map.
     */
    addMap(key: string, f: (writer: WriterMap) => void): this;

    /**
     * Writes arbitrary writable object to map.
     */
    addWritable(key: string, value: Writable): this;
}