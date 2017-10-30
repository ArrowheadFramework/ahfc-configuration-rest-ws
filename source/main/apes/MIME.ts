import { Read, read } from "./Read";
import { Readable } from "stream";
import { Write, write } from "./Write";
import { Writer } from "./Writer";
import { WriterJSON } from "./WriterJSON";
import { WriterAnnotatedXML } from "./WriterAnnotatedXML";

class Option<T> {
    public constructor(
        private readonly type: RegExp,
        private readonly subtype: RegExp,
        public readonly mime: string,
        public readonly t?: T,
    ) { }

    public matches(mimeType: string): boolean {
        mimeType = mimeType.trim();
        if (mimeType === "*") {
            return true;
        }
        const matches = /^([^\/]+)\/([^;]+)/.exec(mimeType);
        if (matches.length < 3) {
            return false;
        }
        const type = matches[1].trim();
        const subtype = matches[2].trim();
        return (type === "*" || this.type.test(type)) &&
            (subtype === "*" || this.subtype.test(subtype));
    }
}

const OPTIONS_READ: Option<Read>[] = [
    new Option(/^application$/i, /\+?json\+?/i, "application/json", read.JSON),
];
const OPTIONS_WRITE: Option<Write>[] = [
    new Option(/^application$/i, /\+?json\+?/i, "application/json", write.JSON),
    new Option(/^application$/i, /^apes\+xml$/i, "application/apes+xml",
        write.annotatedXML),
];

/**
 * Maps between MIME types and APES read functions or writers.
 */
export const MIME = {
    /**
     * Requests read function for given MIME type.
     * 
     * @param mimeType MIME type.
     * @return Read function, or `undefined` if no matching decoder exists.
     */
    decoderFor: (mimeType: string): Read => {
        if (!mimeType) {
            return undefined;
        }
        let option = OPTIONS_READ.find(option => option.matches(mimeType));
        return option ? option.t : undefined;
    },

    /**
     * Requests `Writer` factory function for given MIME type.
     * 
     * @param mimeType MIME type.
     * @return Writer factory and full MIME type identifier, or `undefined` if
     * no matching encoder exists.
     */
    encoderFor: (mimeType: string): [Write, string] => {
        if (!mimeType) {
            return undefined;
        }
        let option = OPTIONS_WRITE.find(option => option.matches(mimeType));
        return option ? [option.t, option.mime] : [undefined, undefined];
    }
}