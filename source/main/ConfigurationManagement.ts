import * as acml from "./acml";

/**
 * An object useful for managing configuration data.
 */
export class ConfigurationManagement {
    /**
     * Adds given array of documents, if all added documents are sound.
     * 
     * If an added document has a document name equal to any existing document,
     * the existing document is replaced.
     * 
     * @param documents Documents to add.
     * @return A list of reports in an order corresponds with that of the given
     * array of documents. Reports are provided for all documents, even if they
     * are all sound.
     */
    addDocuments(documents: acml.Document[]): Promise<acml.Report[]> {
        throw new Error("Not implemented");
    }

    /**
     * Retrieves all known documents with names matching those given.
     * 
     * The provided names may be fully or partially qualified. In case of any
     * partially qualified name, all documents that begins with the same path
     * segments are considered matches. Note that a single empty name, or a
     * array of zero names, will match all known documents.
     * 
     * @param names An array of fully or partially qualified document names.
     * @return A list of documents.
     */
    listDocuments(names: string[]): Promise<acml.Document[]> {
        throw new Error("Not implemented");
    }

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
    removeDocuments(names: string[]): Promise<void> {
        throw new Error("Not implemented");
    }

    /**
     * Adds given array of templates.
     * 
     * If an added template has a template name equal to any existing template,
     * the existing template is replaced.
     * 
     * @param documents Templates to add.
     * @return A promise resolved with nothing when the operation is completed.
     */
    addTemplates(templates: acml.Template[]): Promise<void> {
        throw new Error("Not implemented");
    }

    /**
     * Retrieves all known templates with names matching those given.
     * 
     * The provided names may be fully or partially qualified. In case of any
     * partially qualified name, all templates that begins with the same path
     * segments are considered matches. Note that a single empty name, or a
     * array of zero names, will match all known templates.
     * 
     * @param names An array of fully or partially qualified template names.
     * @return A list of templates.
     */
    listTemplates(names: string[]): Promise<acml.Template[]> {
        throw new Error("Not implemented");
    }

    /**
     * Removes all known templates with names matching those given.
     * 
     * The provided names may be fully or partially qualified. In case of any
     * partially qualified name, all templates that begins with the same path
     * segments are considered matches. Note that a single empty name, or a
     * array of zero names, will match all known templates.
     * 
     * @param names An array of fully or partially qualified template names.
     * @return A promise resolved with nothing when the operation is completed.
     */
    removeTemplates(names: string[]): Promise<void> {
        throw new Error("Not implemented");
    }
}