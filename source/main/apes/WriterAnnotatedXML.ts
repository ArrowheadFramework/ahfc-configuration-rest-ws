import * as stream from "stream";
import { Writable } from "./Writable";
import { Writer, WriterList, WriterMap } from "./Writer";

/**
 * An APES writer that generates Annotated XML encoded data.
 */
export class WriterAnnotatedXML implements Writer {
    /**
     * Creates new writer, emitting written data to provided stream.
     * 
     * @param sink Stream to write to.
     */
    public constructor(
        private readonly sink: stream.Writable,
        private readonly tag = "root",
        private readonly key: string = undefined,
    ) { }

    public writeList(f: (writer: WriterList) => void) {
        this.sink.write('<' + this.tag +
            (this.key ? (' key="' + this.key + '"') : '') +
            (this.tag === 'root' ? ' semantics="APES"' : '') +
            ' type="List">');
        f(new WriterListAnnotatedXML(this.sink));
        this.sink.write('</' + this.tag + '>');
    }

    public writeMap(f: (writer: WriterMap) => void) {
        this.sink.write('<' + this.tag +
            (this.key ? (' key="' + this.key + '"') : '') +
            (this.tag === 'root' ? ' semantics="APES"' : '') +
            ' type="Map">');
        f(new WriterMapAnnotatedXML(this.sink));
        this.sink.write('</' + this.tag + '>');
    }
}

class WriterListAnnotatedXML implements WriterList {
    public constructor(
        private readonly sink: stream.Writable,
    ) { }

    public addNull(): this {
        return this.writeItem("Null", "null");
    }

    public addBoolean(value: boolean): this {
        return this.writeItem("Boolean", value ? "true" : "false");
    }

    public addNumber(value: number): this {
        if (!Number.isFinite(value as number)) {
            throw new Error(
                "Non-finite number cannot be written: " + value
            );
        }
        return this.writeItem("Number", value.toString());
    }

    public addText(value: string): this {
        return this.writeItem("Text", value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;"));
    }

    public addList(f: (writer: WriterList) => void) {
        this.sink.write('<item type="List">');
        f(new WriterListAnnotatedXML(this.sink));
        this.sink.write('</item>');
        return this;
    }

    public addMap(f: (writer: WriterMap) => void) {
        this.sink.write('<item type="Map">');
        f(new WriterMapAnnotatedXML(this.sink));
        this.sink.write('</item>');
        return this;
    }

    public addWritable(value: Writable): this {
        value.write(new WriterAnnotatedXML(this.sink, "item"));
        return this;
    }

    private writeItem(type: string, contents: string): this {
        this.sink.write('<item type="' + type + '">' + contents + '</item>');
        return this;
    }
}

class WriterMapAnnotatedXML implements WriterMap {
    private counter = 0;

    public constructor(
        private readonly sink: stream.Writable,
    ) { }

    public addNull(key: string): this {
        return this.writeEntry(key, "Null", "null");
    }

    public addBoolean(key: string, value: boolean): this {
        return this.writeEntry(key, "Boolean", value ? "true" : "false");
    }

    public addNumber(key: string, value: number): this {
        if (!Number.isFinite(value as number)) {
            throw new Error(
                "Non-finite number cannot be written: " + value
            );
        }
        return this.writeEntry(key, "Number", value.toString());
    }

    public addText(key: string, value: string): this {
        return this.writeEntry(key, "Text", value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;"));
    }

    public addList(key: string, f: (writer: WriterList) => void) {
        this.checkKey(key);
        this.sink.write('<entry key="' + key + '" type="List">');
        f(new WriterListAnnotatedXML(this.sink));
        this.sink.write('</entry>');
        return this;
    }

    public addMap(key: string, f: (writer: WriterMap) => void) {
        this.checkKey(key);
        this.sink.write('<entry key="' + key + '" type="Map">');
        f(new WriterMapAnnotatedXML(this.sink));
        this.sink.write('</entry>');
        return this;
    }

    public addWritable(key: string, value: Writable): this {
        this.checkKey(key);
        value.write(new WriterAnnotatedXML(this.sink, "entry", key));
        return this;
    }

    private writeEntry(key: string, type: string, contents: string): this {
        this.checkKey(key);
        this.sink.write('<entry key="' + key + '" type="' + type + '">' +
            contents + '</entry>');
        return this;
    }

    private checkKey(key: string) {
        if (!/^[a-zA-Z_][0-9a-zA-Z_]*$/.test(key)) {
            throw new Error("Map key not APES compliant: " + key);
        }
    }
}