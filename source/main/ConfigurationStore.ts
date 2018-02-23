import * as acml from "./acml";
import * as db from "./db";

/**
 * An object useful for requesting configuration data.
 */
export interface ConfigurationStore {
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
}