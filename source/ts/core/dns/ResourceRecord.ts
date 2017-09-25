import { Type } from "./constants";
import { Reader, Writer } from "./io";
import { read as readResourceData, ResourceData } from "./ResourceData";

/**
 * A DNS resource record, as described by RFC 1035.
 */
export class ResourceRecord {
    /**
     * Creates new reasource record from given parameters.
     */
    public constructor(
        public readonly name: string,
        public readonly type: number,
        public readonly dclass: number,
        public readonly ttl: number = 0,
        public readonly rdata?: ResourceData
    ) { }

    /**
     * Reads record from given reader.
     *
     * @param reader Reader containing record data.
     * @param isQuestion Whether record is read from `Message` questions part.
     */
    public static read(reader: Reader, isQuestion = false): ResourceRecord {
        const name = reader.readName();
        const type = reader.readU16();
        const dclass = reader.readU16();

        if (isQuestion) {
            return new ResourceRecord(name, type, dclass);
        }

        const ttl = reader.readU32();
        const rdlength = reader.readU16();
        const rdreader = reader.pop(rdlength);
        const rdata = readResourceData(type, rdlength, rdreader);

        return new ResourceRecord(name, type, dclass, ttl, rdata);
    }

    /**
     * Length of record, in bytes, if written using `Writer`.
     *
     * @param isQuestion Whether record would be part of `Message` questions.
     * @return Record length, in bytes.
     */
    public length(isQuestion = false): number {
        return this.name.length + 6 + (isQuestion
            ? 0
            : 6 + (this.rdata
                ? this.rdata.rdlength
                : 0));
    }

    /**
     * Writes record to writer.
     *
     * @param writer Writer to receive record data.
     * @param isQuestion Whether record is to be part of `Message` questions.
     */
    public write(writer: Writer, isQuestion = false) {
        writer.writeName(this.name);
        writer.writeU16(this.type);
        writer.writeU16(this.dclass);
        if (isQuestion) {
            return;
        }
        writer.writeU32(this.ttl);
        if (this.rdata) {
            writer.writeU16(this.rdata.rdlength);
            this.rdata.write(writer);
        } else {
            writer.writeU16(0);
        }
    }
}
