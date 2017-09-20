import { Type } from "./constants";
import { Reader, Writer } from "./io";

/**
 * A DNS resource data object, as described by RFC 1035.
 */
export interface ResourceData {
    /**
     * Resource data length, in bytes.
     */
    readonly rdlength: number;

    /**
     * Writes resource data object to given writer.
     */
    write(writer: Writer);
}

/**
 * Reads resource data object from give reader.
 * 
 * @param type Type of resource data to read.
 * @param rdlength Length of read resource data object.
 * @param reader Reader containing resource data object.
 * @return Read data object.
 */
export function read(type: number, rdlength: number, reader: Reader) {
    let rdread: (reader: Reader, rdlength?: number) => ResourceData;
    switch (type) {
        case Type.A: rdread = A.read; break;
        case Type.AAAA: rdread = AAAA.read; break;
        case Type.NS: rdread = NS.read; break;
        case Type.CNAME: rdread = CNAME.read; break;
        case Type.SOA: rdread = SOA.read; break;
        case Type.PTR: rdread = PTR.read; break;
        case Type.MX: rdread = MX.read; break;
        case Type.TXT: rdread = TXT.read; break;
        case Type.SRV: rdread = SRV.read; break;
        case Type.TSIG: rdread = TSIG.read; break;
        default:
            return new ANY(reader.read(rdlength).toString("binary"));
    }
    return rdread(reader, rdlength);
}

/**
 * An RFC 1035 A resource.
 */
export class A implements ResourceData {
    public readonly rdlength: number = 4;

    public constructor(public readonly address: string) { }

    public static read(reader: Reader): A {
        return new A(
            reader.readU8() + "." +
            reader.readU8() + "." +
            reader.readU8() + "." +
            reader.readU8());
    }

    public write(writer: Writer) {
        this.address.split(".").forEach(part => {
            const u8 = Number.parseInt(part, 10) & 0xff;
            writer.writeU8(u8);
        });
    }
}

/**
 * An RFC 3596 AAAA resource.
 */
export class AAAA implements ResourceData {
    public readonly rdlength: number = 16;

    public constructor(public readonly address: string) { }

    public static read(reader: Reader): AAAA {
        return new AAAA(
            reader.readU16().toString(16) + ":" +
            reader.readU16().toString(16) + ":" +
            reader.readU16().toString(16) + ":" +
            reader.readU16().toString(16) + ":" +
            reader.readU16().toString(16) + ":" +
            reader.readU16().toString(16) + ":" +
            reader.readU16().toString(16) + ":" +
            reader.readU16().toString(16));
    }

    public write(writer: Writer) {
        this.address.split(".").forEach(part => {
            const u16 = Number.parseInt(part, 16) & 0xffff;
            writer.writeU8(u16);
        });
    }
}

export class ANY implements ResourceData {
    public readonly rdlength: number;

    /**
     * @param rdata Arbitrary resource data.
     */
    public constructor(public readonly rdata: string) {
        this.rdlength = rdata.length;
    }

    public write(writer: Writer) {
        writer.write(Buffer.from(this.rdata, "binary"));
    }
}

/**
 * An RFC 1035 CNAME resource.
 */
export class CNAME implements ResourceData {
    public readonly rdlength: number;

    public constructor(public readonly cname: string) {
        this.rdlength = cname.length + 2;
    }

    public static read(reader: Reader): CNAME {
        return new CNAME(reader.readName());
    }

    public write(writer: Writer) {
        writer.writeName(this.cname);
    }
}

/**
 * An RFC 1035 MX resource.
 */
export class MX implements ResourceData {
    public readonly rdlength: number;

    public constructor(
        public readonly preference: number,
        public readonly exchange: string
    ) {
        this.rdlength = exchange.length + 4;
    }

    public static read(reader: Reader): MX {
        return new MX(reader.readU16(), reader.readName());
    }

    public write(writer: Writer) {
        writer.writeU16(this.preference);
        writer.writeName(this.exchange);
    }
}

/**
 * An RFC 1035 NS resource.
 */
export class NS implements ResourceData {
    public readonly rdlength: number;

    public constructor(public readonly nsdname: string) {
        this.rdlength = nsdname.length + 2;
    }

    public static read(reader: Reader): NS {
        return new NS(reader.readName());
    }

    public write(writer: Writer) {
        writer.writeName(this.nsdname);
    }
}

/**
 * An RFC 1035 PTR resource.
 */
export class PTR implements ResourceData {
    public readonly rdlength: number;

    public constructor(public readonly ptrdname: string) {
        this.rdlength = ptrdname.length + 2;
    }

    public static read(reader: Reader): PTR {
        return new PTR(reader.readName());
    }

    public write(writer: Writer) {
        writer.writeName(this.ptrdname);
    }
}

/**
 * An RFC 1035 SOA resource.
 */
export class SOA implements ResourceData {
    public readonly rdlength: number;

    public constructor(
        public readonly mname: string,
        public readonly rname: string,
        public readonly serial: number,
        public readonly refresh: number,
        public readonly retry: number,
        public readonly expire: number,
        public readonly minimum: number
    ) {
        this.rdlength = mname.length + rname.length + 24;
    }

    public static read(reader: Reader): SOA {
        return new SOA(
            reader.readName(),
            reader.readName(),
            reader.readU32(),
            reader.readU32(),
            reader.readU32(),
            reader.readU32(),
            reader.readU32()
        );
    }

    public write(writer: Writer) {
        writer.writeName(this.mname);
        writer.writeName(this.rname);
        writer.writeU32(this.serial);
        writer.writeU32(this.refresh);
        writer.writeU32(this.retry);
        writer.writeU32(this.expire);
        writer.writeU32(this.minimum);
    }
}

/**
 * An RFC 2728 SRC resource.
 */
export class SRV implements ResourceData {
    public readonly rdlength: number;

    public constructor(
        public readonly priority: number,
        public readonly weight: number,
        public readonly port: number,
        public readonly target: string
    ) {
        this.rdlength = target.length + 8;
    }

    public static read(reader: Reader): SRV {
        return new SRV(
            reader.readU16(),
            reader.readU16(),
            reader.readU16(),
            reader.readName()
        );
    }

    public write(writer: Writer) {
        writer.writeU16(this.priority);
        writer.writeU16(this.weight);
        writer.writeU16(this.port);
        writer.writeName(this.target);
    }
}

/**
 * An RFC 2845 TSIG resource.
 */
export class TSIG implements ResourceData {
    public readonly rdlength: number;

    public constructor(
        public readonly algorithmName: string,
        public readonly timeSigned: number,
        public readonly fudge: number,
        public readonly mac: string,
        public readonly originalId: number,
        public readonly error: number,
        public readonly otherData: string
    ) {
        this.rdlength = algorithmName.length + mac.length + otherData.length
            + 18;
    }

    public static read(reader: Reader): TSIG {
        return new TSIG(
            reader.readName(),
            reader.readU48(),
            reader.readU16(),
            reader.read(reader.readU16()).toString("binary"),
            reader.readU16(),
            reader.readU16(),
            reader.read(reader.readU16()).toString("binary")
        );
    }

    public write(writer: Writer) {
        writer.writeName(this.algorithmName);
        writer.writeU48(this.timeSigned);
        writer.writeU16(this.fudge);
        writer.writeU16(this.mac.length);
        writer.write(Buffer.from(this.mac, "binary"));
        writer.writeU16(this.originalId);
        writer.writeU16(this.error);
        writer.writeU16(this.otherData.length);
        writer.write(Buffer.from(this.otherData, "binary"));
    }
}

/**
 * An RFC 1035 TXT resource.
 */
export class TXT implements ResourceData {
    public readonly rdlength: number;

    public constructor(public readonly txtData: string) {
        this.rdlength = this.txtData.length;
    }

    /**
     * Converts given attributes into an RFC 1464 compatible TXT resource.
     * 
     * @param attributes Attributes to convert.
     * @returns New TXT resource.
     */
    public static fromAttributes(attributes: { [key: string]: string }): TXT {
        const rdlength = Object.getOwnPropertyNames(attributes)
            .reduce((length, key) => {
                const value = attributes[key];
                return length + key.length + value.length + 2;
            }, 1);
        const writer = new Writer(Buffer.alloc(rdlength));

        const keys = Object.getOwnPropertyNames(attributes);
        let strings = new Array<string>(keys.length);
        keys.forEach((key, index) => {
            const value = attributes[key];
            const string = format(key) + "=" + (value || "");
            strings[index] = string;
        });
        writer.writeStrings(strings);

        return new TXT(writer.sink.toString("binary"));

        function format(key: string): string {
            let result = "";
            for (let i = 0; i < key.length; ++i) {
                const c = key.charAt(i);
                switch (c) {
                    case "\t":
                    case "\n":
                    case " ":
                    case "=":
                    case "`":
                        result += ("`" + c);
                        break;

                    default:
                        const cc = c.charCodeAt(0);
                        if (cc > 0x20 && cc < 0x7f) {
                            result += c;
                        }
                        break;
                }
            }
            return result.toLowerCase();
        }
    }

    public static read(reader: Reader, rdlength: number): TXT {
        return new TXT(reader.read(rdlength).toString("binary"));
    }

    /**
     * Interprets contents of this TXT resource as if being an RFC 1464
     * compatible resource set.
     */
    public intoAttributes(): { [key: string]: string } {
        let attributes = {};
        new Reader(Buffer.from(this.txtData, "binary"))
            .readStrings()
            .forEach(string => {
                const pair = split(string);
                if (pair !== null) {
                    attributes[pair[0]] = pair[1];
                }
            });
        return attributes;

        function split(string: string): [string, string] {
            let key = "";
            for (let i = 0; i < string.length; ++i) {
                const c = string.charAt(i);
                switch (c) {
                    case "`":
                        key += string.charAt(i + 1);
                        i += 1;
                        break;

                    case "=":
                        return [key.toLowerCase(), string.substring(i + 1)];

                    default:
                        const cc = c.charCodeAt(0);
                        if (cc > 0x20 && cc < 0x7f) {
                            key += c;
                        }
                }
            }
            return null;
        }
    }

    public write(writer: Writer) {
        writer.write(Buffer.from(this.txtData, "binary"));
    }
}
