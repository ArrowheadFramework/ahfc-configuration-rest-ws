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
     *
     * @return Self.
     */
    addNull(): this;

    /**
     * Writes boolean to list.
     *
     * @param value Boolean to add.
     * @return Self.
     */
    addBoolean(value: boolean): this;

    /**
     * Writes number to list.
     *
     * The number must be finite, or an exception is thrown.
     *
     * @param value Number to add.
     * @return Self.
     */
    addNumber(value: number): this;

    /**
     * Writes text to list.
     *
     * @param value Text to add.
     * @return Self.
     */
    addText(value: string): this;

    /**
     * Writes list to list.
     *
     * @param f Consumer function receiving writer used to encode a list.
     * @return Self.
     */
    addList(f: (writer: WriterList) => void): this;

    /**
     * Writes map to list.
     *
     * @param f Consumer function receiving writer used to encode a map.
     * @return Self.
     */
    addMap(f: (writer: WriterMap) => void): this;

    /**
     * Writes arbitrary writable object to list.
     *
     * @param value Arbitrary writable to add.
     * @return Self.
     */
    addWritable(value: Writable): this;
}

/**
 * Represents an APES-compliant map encoder.
 */
export interface WriterMap {
    /**
     * Writes null entry to map.
     *
     * @param key Map key.
     * @return Self.
     */
    addNull(key: string): this;

    /**
     * Writes boolean entry to map.
     *
     * @param key Map key.
     * @param value Boolean to add.
     * @return Self.
     */
    addBoolean(key: string, value: boolean): this;

    /**
     * Writes number entry to map.
     *
     * The number must be finiteor an exception is thrown.
     *
     * @param key Map key.
     * @param value Number to add.
     * @return Self.
     */
    addNumber(key: string, value: number): this;

    /**
     * Writes text entry to map.
     *
     * @param key Map key.
     * @param value Text to add.
     * @return Self.
     */
    addText(key: string, value: string): this;

    /**
     * Writes list entry to map.
     *
     * @param key Map key.
     * @param f Consumer function receiving writer used to encode a list.
     * @return Self.
     */
    addList(key: string, f: (writer: WriterList) => void): this;

    /**
     * Writes map entry to map.
     *
     * @param key Map key.
     * @param f Consumer function receiving writer used to encode a map.
     * @return Self.
     */
    addMap(key: string, f: (writer: WriterMap) => void): this;

    /**
     * Writes arbitrary writable object to map.
     *
     * @param key Map key.
     * @param value Arbitrary writable to add.
     * @return Self.
     */
    addWritable(key: string, value: Writable): this;
}