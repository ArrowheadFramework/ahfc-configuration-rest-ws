/**
 * Represents an APES-compliant decoder.
 */
export interface Reader {
    /**
     * Decodes whatever data is held by the reader.
     *
     * As ECMAScript objects per definition are APES-compliant, the result of
     * calling this method will always be either an object, or an exception
     * indicating why reading failed.
     *
     * @return Promise of eventual read completion, holding decoded object.
     */
    read(): Promise<object>;
}