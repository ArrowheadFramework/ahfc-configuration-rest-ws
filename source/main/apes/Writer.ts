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
export abstract class WriterList {
    /**
     * Writes dynamic type to list.
     *
     * @param value Dynamic value to add.
     * @return Self.
     */
    public add(value: any): this {
        if (value === null) {
            return this.addNull();
        }
        switch (typeof value) {
            case "undefined":
                return this.addNull();

            case "boolean":
                return this.addBoolean(value);

            case "number":
                return this.addNumber(value);

            case "string":
                return this.addText(value);

            case "object":
                break;

            default:
                throw new TypeError("Bad value type: " + value);
        }
        if (value.isWritable) {
            return this.addWritable(value);
        }
        if (value instanceof Map) {
            return this.addMap(writer => {
                for (const entry of value.entries()) {
                    writer.add("" + entry[0], entry[1]);
                }
            });
        }
        if (typeof value[Symbol.iterator] === "function" || Array.isArray(value)) {
            return this.addList(writer => {
                for (const item of value) {
                    writer.add(item);
                }
            });
        }
        return this.addMap(writer => Object
            .getOwnPropertyNames(value)
            .forEach(name => writer.add(name, value[name])));
    }

    /**
     * Writes null to list.
     *
     * @return Self.
     */
    public abstract addNull(): this;

    /**
     * Writes boolean to list.
     *
     * @param value Boolean to add.
     * @return Self.
     */
    public abstract addBoolean(value: boolean): this;

    /**
     * Writes number to list.
     *
     * The number must be finite, or an exception is thrown.
     *
     * @param value Number to add.
     * @return Self.
     */
    public abstract addNumber(value: number): this;

    /**
     * Writes text to list.
     *
     * @param value Text to add.
     * @return Self.
     */
    public abstract addText(value: string): this;

    /**
     * Writes list to list.
     *
     * @param f Consumer function receiving writer used to encode a list.
     * @return Self.
     */
    public abstract addList(f: (writer: WriterList) => void): this;

    /**
     * Writes map to list.
     *
     * @param f Consumer function receiving writer used to encode a map.
     * @return Self.
     */
    public abstract addMap(f: (writer: WriterMap) => void): this;

    /**
     * Writes arbitrary writable object to list.
     *
     * @param value Arbitrary writable to add.
     * @return Self.
     */
    public abstract addWritable(value: Writable): this;
}

/**
 * Represents an APES-compliant map encoder.
 */
export abstract class WriterMap {
    /**
     * Writes dynamic type entry to map.
     *
     * @param key Map key.
     * @param value Dynamic value to add.
     * @return Self.
     */
    public add(key: string, value: any): this {
        if (value === null) {
            return this.addNull(key);
        }
        switch (typeof value) {
            case "undefined":
                return this.addNull(key);

            case "boolean":
                return this.addBoolean(key, value);

            case "number":
                return this.addNumber(key, value);

            case "string":
                return this.addText(key, value);

            case "object":
                break;

            default:
                throw new TypeError("Bad value type: " + value);
        }
        if (value instanceof Map) {
            return this.addMap(key, writer => {
                for (const entry of value.entries()) {
                    writer.add("" + entry[0], entry[1]);
                }
            });
        }
        if (typeof value[Symbol.iterator] === "function" || Array.isArray(value)) {
            return this.addList(key, writer => {
                for (const item of value) {
                    writer.add(item);
                }
            });
        }
        return this.addMap(key, writer => Object
            .getOwnPropertyNames(value)
            .forEach(name => writer.add(name, value[name])));
    }

    /**
     * Writes null entry to map.
     *
     * @param key Map key.
     * @return Self.
     */
    public abstract addNull(key: string): this;

    /**
     * Writes boolean entry to map.
     *
     * @param key Map key.
     * @param value Boolean to add.
     * @return Self.
     */
    public abstract addBoolean(key: string, value: boolean): this;

    /**
     * Writes number entry to map.
     *
     * The number must be finiteor an exception is thrown.
     *
     * @param key Map key.
     * @param value Number to add.
     * @return Self.
     */
    public abstract addNumber(key: string, value: number): this;

    /**
     * Writes text entry to map.
     *
     * @param key Map key.
     * @param value Text to add.
     * @return Self.
     */
    public abstract addText(key: string, value: string): this;

    /**
     * Writes list entry to map.
     *
     * @param key Map key.
     * @param f Consumer function receiving writer used to encode a list.
     * @return Self.
     */
    public abstract addList(key: string, f: (writer: WriterList) => void): this;

    /**
     * Writes map entry to map.
     *
     * @param key Map key.
     * @param f Consumer function receiving writer used to encode a map.
     * @return Self.
     */
    public abstract addMap(key: string, f: (writer: WriterMap) => void): this;

    /**
     * Writes arbitrary writable object to map.
     *
     * @param key Map key.
     * @param value Arbitrary writable to add.
     * @return Self.
     */
    public abstract addWritable(key: string, value: Writable): this;
}