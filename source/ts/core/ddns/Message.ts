import { DClass, OpCode, RCode, Type } from "./constants";
import { Reader, Writer } from "./io";
import { ResourceRecord } from "./ResourceRecord";

/**
 * An RFC 1035 message.
 */
export class Message {
    private static nextId: number = (Math.random() * 65535) | 0;

    /**
     * Creates new message.
     * 
     * For most intents and purposes it is advisable to use `Message.newID()` to
     * generate identifiers for transmitted requests.
     */
    public constructor(
        public readonly id: number,
        public readonly flags: {
            qr?: boolean,
            opcode: number,
            aa?: boolean,
            tc?: boolean,
            rd?: boolean,
            ra?: boolean,
            z?: number,
            rcode?: number,
        },
        public readonly questions: ResourceRecord[] = [],
        public readonly answers: ResourceRecord[] = [],
        public readonly authorities: ResourceRecord[] = [],
        public readonly additionals: ResourceRecord[] = []
    ) { }

    /**
     * Creates new DNS QUERY message.
     * 
     * @param hostname Hostname to query.
     * @param type Query type.
     * @param rd Whether the query is to be recursive.
     * @param dclass Query domain class.
     */
    public static newQuery(
        hostname: string,
        type: Type,
        rd = true,
        dclass = DClass.IN
    ): Message {
        return new Message(
            Message.newID(),
            { opcode: OpCode.QUERY, rd },
            [new ResourceRecord(hostname, type, dclass)]
        );
    }

    /**
     * Reads message from source. 
     * 
     * @param source Source of message.
     * @returns Read message.
     */
    public static read(source: Reader | Buffer): Message {
        const reader: Reader = source instanceof Buffer
            ? new Reader(source)
            : source;

        const id = reader.readU16();
        const flags = reader.readU16();

        const qdcount = reader.readU16();
        const ancount = reader.readU16();
        const nscount = reader.readU16();
        const arcount = reader.readU16();

        const questions = new Array(qdcount);
        for (let i = 0; i < qdcount; ++i) {
            questions[i] = ResourceRecord.read(reader, true);
        }
        const answers = new Array(ancount);
        for (let i = 0; i < ancount; ++i) {
            answers[i] = ResourceRecord.read(reader);
        }
        const authorities = new Array(nscount);
        for (let i = 0; i < nscount; ++i) {
            authorities[i] = ResourceRecord.read(reader);
        }
        const additionals = new Array(arcount);
        for (let i = 0; i < arcount; ++i) {
            additionals[i] = ResourceRecord.read(reader);
        }

        return new Message(
            id,
            {
                qr: (flags & 0x8000) != 0,
                opcode: ((flags >> 11) & 0xf),
                aa: (flags & 0x0400) != 0,
                tc: (flags & 0x0200) != 0,
                rd: (flags & 0x0100) != 0,
                ra: (flags & 0x0080) != 0,
                z: ((flags >> 4) & 0x7),
                rcode: (flags & 0xf),
            },
            questions,
            answers,
            authorities,
            additionals
        );
    }

    /**
     * @returns Byte length of message, if written using `write()`.
     */
    public length(): number {
        return 12 +
            this.questions.reduce((sum, rr) => sum + rr.length(true), 0) +
            this.answers.reduce((sum, rr) => sum + rr.length(), 0) +
            this.authorities.reduce((sum, rr) => sum + rr.length(), 0) +
            this.additionals.reduce((sum, rr) => sum + rr.length(), 0);
    }

    /**
     * Writes message to sink.
     * 
     * @param sink Destination of message.
     */
    public write(sink: Writer | Buffer) {
        const writer: Writer = sink instanceof Buffer
            ? new Writer(sink)
            : sink;

        writer.writeU16(this.id);
        writer.writeU16(
            (this.flags.qr ? 0x8000 : 0x0000) |
            ((this.flags.opcode & 0xf) << 11) |
            (this.flags.aa ? 0x0400 : 0x0000) |
            (this.flags.tc ? 0x0200 : 0x0000) |
            (this.flags.rd ? 0x0100 : 0x0000) |
            (this.flags.ra ? 0x0080 : 0x0000) |
            ((this.flags.z & 0x7) << 4) |
            (this.flags.rcode & 0xf)
        );

        writer.writeU16(this.questions.length);
        writer.writeU16(this.answers.length);
        writer.writeU16(this.authorities.length);
        writer.writeU16(this.additionals.length);

        this.questions.forEach(record => record.write(writer, true));
        this.answers.forEach(record => record.write(writer));
        this.authorities.forEach(record => record.write(writer));
        this.additionals.forEach(record => record.write(writer));
    }

    /**
     * Creates identifier useful when creating new `Message`s.
     */
    public static newID(): number {
        const result = this.nextId;
        this.nextId = (this.nextId + 1) & 0xffff;
        return result;
    }
}