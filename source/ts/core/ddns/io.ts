/**
 * An RFC 1035 compatible byte buffer reader.
 */
export class Reader {
    private cursor: number;

    public readonly source: Buffer;

    public constructor(source: Buffer, offset: number = 0) {
        this.cursor = offset;
        this.source = source;
    }

    public pop(length: number): Reader {
        const reader = new Reader(this.source, this.cursor);
        this.cursor += length;
        return reader;
    }

    public read(length: number): Buffer {
        const cursor = Math.min(this.source.length, this.cursor + length);
        const buffer = this.source.slice(this.cursor, cursor);
        this.cursor = cursor;
        return buffer;
    }

    public readName(): string {
        let name = "";
        let length;
        while ((length = this.readU8()) !== 0) {
            if (length > 63) {
                this.cursor -= 1;
                const field = this.readU16() & 0x3fff;
                if ((length & 0xc0) === 0xc0) {
                    name += new Reader(this.source, field).readName();
                }
                break;
            }
            name += this.read(length).toString("binary") + ".";
        };
        return name;
    }

    public readString(): string {
        return this.read(this.readU8()).toString("binary");
    }

    public readStrings(): string[] {
        const strings = new Array();
        let length;
        do {
            length = this.readU8();
            strings.push(this.read(length).toString("binary"));
        } while (length > 0);
        return strings;
    }

    public readU8(): number {
        if (this.cursor + 1 > this.source.length) {
            return 0;
        }
        const u8 = this.source.readUInt8(this.cursor);
        this.cursor += 1;
        return u8;
    }

    public readU16(): number {
        if (this.cursor + 2 > this.source.length) {
            return 0;
        }
        const u16 = this.source.readUInt16BE(this.cursor);
        this.cursor += 2;
        return u16;
    }

    public readU32(): number {
        if (this.cursor + 4 > this.source.length) {
            return 0;
        }
        const u32 = this.source.readUInt32BE(this.cursor);
        this.cursor += 4;
        return u32;
    }

    public readU48(): number {
        if (this.cursor + 6 > this.source.length) {
            return 0;
        }
        const hi = this.source.readUInt16BE(this.cursor);
        const lo = this.source.readUInt32BE(this.cursor + 2);
        this.cursor += 6;
        return (hi * 4294967296) + lo;
    }
}

/**
 * An RFC 1035 compatible byte buffer writer.
 */
export class Writer {
    private cursor: number = 0;

    public readonly sink: Buffer;

    public constructor(sink: Buffer) {
        this.sink = sink;
    }

    public write(source: Buffer) {
        this.cursor += source.copy(this.sink, this.cursor);
    }

    public writeName(name: string = "") {
        this.writeStrings(name.split("."), 0x3f);
    }

    public writeString(string: string = "") {
        this.writeU8(string.length);
        this.sink.write(string, this.cursor);
    }

    public writeStrings(strings: string[] = [], lengthMask = 0xff) {
        strings.forEach(string => {
            const length = string.length & lengthMask;
            if (length > 0) {
                this.writeU8(length);
                this.cursor += this.sink.write(string, this.cursor, length);
            }
        });
        this.writeU8(0);
    }

    public writeU8(u8: number = 0) {
        this.cursor = this.sink.writeUInt8(u8, this.cursor);
    }

    public writeU16(u16: number = 0) {
        this.cursor = this.sink.writeUInt16BE(u16, this.cursor);
    }

    public writeU32(u32: number = 0) {
        this.cursor = this.sink.writeUInt32BE(u32, this.cursor);
    }

    public writeU48(u48: number = 0) {
        this.cursor = this.sink.writeUInt16BE(u48 / 4294967296, this.cursor);
        this.cursor = this.sink.writeUInt32BE(u48 & 0xffffffff, this.cursor);
    }
}