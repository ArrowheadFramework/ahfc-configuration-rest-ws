import * as acml from "./acml";
import * as db from "./db";

/**
 * An object useful for requesting configuration data.
 */
export interface ConfigurationStore {
    /**
     * Adds given array of documents, if all of them are sound.
     *
     * If an added document has a document name equal to any existing document,
     * the existing document is replaced.
     *
     * @param documents Documents to add.
     * @return A list of document validation reports. Reports are provided for
     * all documents, even if they are sound.
     */
    addDocuments(documents: acml.Document[]): Promise<acml.Report[]>;

    /**
     * Retrieves all documents with names matching those given a current user
     * is allowed to see.
     *
     * The provided names may be fully or partially qualified. In case of any
     * partially qualified name, all documents that begins with the same path
     * segments are considered matches. Note that a single empty name, or a
     * array of zero names, will match all known documents.
     *
     * @param names An array of fully or partially qualified document names.
     * @return A list of documents.
     */
    listDocuments(names: string[]): Promise<acml.Document[]>;

    /**
     * Updates identified parts of existing documents.
     * 
     * @param patches Document patches.
     */
    patchDocuments(patches: acml.Patch[]): Promise<acml.Report[]>;

    /**
     * Removes all known documents with names matching those given.
     *
     * The provided names may be fully or partially qualified. In case of any
     * partially qualified name, all documents that begins with the same path
     * segments are considered matches. Note that a single empty name, or a
     * array of zero names, will match all known documents.
     *
     * @param names An array of fully or partially qualified document names.
     * @return A promise resolved with nothing when the operation is completed.
     */
    removeDocuments(names: string[]): Promise<void>;
}
