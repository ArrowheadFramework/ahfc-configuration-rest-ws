import * as stream from "stream";
import { Writer } from "./Writer";
import { WriterAnnotatedXML } from "./WriterAnnotatedXML";
import { WriterJSON } from "./WriterJSON";

/**
 * Represents an APES-compliant encoder function.
 *
 * A function with the signature is to turn a writable stream into a writer,
 * which in turn may be used to encode an arbitrary APES-compliant data
 * structure.
 * 
 * @param sink Receiver of encoded object.
 * @return Writer used to perform actual object encoding.
 */
export type Write = (sink: stream.Writable) => Writer;

/**
 * APES compliant encoder functions.
 */
export const write = {
    annotatedXML: (sink) => new WriterAnnotatedXML(sink),
    JSON: (sink) => new WriterJSON(sink), 
};
