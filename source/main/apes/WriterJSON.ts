import * as stream from "stream";
import { Writable } from "./Writable";
import { Writer, WriterList, WriterMap } from "./Writer";

/**
 * An APES writer that generates JSON encoded data.
 */
export class WriterJSON implements Writer {
    /**
     * Creates new writer, emitting written data to provided stream.
     * 
     * @param sink Stream to write to.
     */
    public constructor(
        private readonly sink: stream.Writable,
    ) { }

    public writeList(f: (writer: WriterList) => void) {
        this.sink.write("[");
        f(new WriterListJSON(this.sink));
        this.sink.write("]");
    }

    public writeMap(f: (writer: WriterMap) => void) {
        this.sink.write("{");
        f(new WriterMapJSON(this.sink));
        this.sink.write("}");
    }
}

class WriterListJSON implements WriterList {
    private counter = 0;

    public constructor(
        private readonly sink: stream.Writable,
    ) { }

    public addNull(): this {
        this.writeColon();
        this.sink.write("null");
        return this;
    }

    public addBoolean(value: boolean): this {
        this.writeColon();
        this.sink.write(value ? "true" : "false");
        return this;
    }

    public addNumber(value: number): this {
        if (!Number.isFinite(value as number)) {
            throw new Error(
                "Non-finite number cannot be written: " + value
            );
        }
        this.writeColon();
        this.sink.write(value.toString());
        return this;
    }

    public addText(value: string): this {
        this.writeColon();
        value = (value as string)
            .replace('"', '\\"')
            .replace("\\", "\\\\")
            .replace("\b", "\\b")
            .replace("\f", "\\f")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");

        this.sink.write('"' + value + '"');
        return this;
    }

    public addList(f: (writer: WriterList) => void) {
        this.writeColon();
        this.sink.write("[");
        f(new WriterListJSON(this.sink));
        this.sink.write("]");
        return this;
    }

    public addMap(f: (writer: WriterMap) => void) {
        this.writeColon();
        this.sink.write("{");
        f(new WriterMapJSON(this.sink));
        this.sink.write("}");
        return this;
    }

    public addWritable(value: Writable): this {
        this.writeColon();
        value.write(new WriterJSON(this.sink));
        return this;
    }

    private writeColon() {
        if (this.counter++ > 0) {
            this.sink.write(",");
        }
    }
}

class WriterMapJSON implements WriterMap {
    private counter = 0;

    public constructor(
        private readonly sink: stream.Writable,
    ) { }

    public addNull(key: string): this {
        this.writeCommaKeyColon(key);
        this.sink.write("null");
        return this;
    }

    public addBoolean(key: string, value: boolean): this {
        this.writeCommaKeyColon(key);
        this.sink.write(value ? "true" : "false");
        return this;
    }

    public addNumber(key: string, value: number): this {
        if (!Number.isFinite(value as number)) {
            throw new Error(
                "Non-finite number cannot be written: " + value
            );
        }
        this.writeCommaKeyColon(key);
        this.sink.write(value.toString());
        return this;
    }

    public addText(key: string, value: string): this {
        this.writeCommaKeyColon(key);
        value = (value as string)
            .replace('"', '\\"')
            .replace("\\", "\\\\")
            .replace("\b", "\\b")
            .replace("\f", "\\f")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
            .replace("\t", "\\t");

        this.sink.write('"' + value + '"');
        return this;
    }

    public addList(key: string, f: (writer: WriterList) => void) {
        this.writeCommaKeyColon(key);
        this.sink.write("[");
        f(new WriterListJSON(this.sink));
        this.sink.write("]");
        return this;
    }

    public addMap(key: string, f: (writer: WriterMap) => void) {
        this.writeCommaKeyColon(key);
        this.sink.write("{");
        f(new WriterMapJSON(this.sink));
        this.sink.write("}");
        return this;
    }

    public addWritable(key: string, value: Writable): this {
        this.writeCommaKeyColon(key);
        value.write(new WriterJSON(this.sink));
        return this;
    }

    private writeCommaKeyColon(key: string) {
        if (this.counter++ > 0) {
            this.sink.write(",");
        }
        if (!/^[a-zA-Z_][0-9a-zA-Z_]*$/.test(key)) {
            throw new Error("Map key not APES compliant: " + key);
        }
        this.sink.write('"' + key + '":');
    }
}