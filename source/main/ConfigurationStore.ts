import * as acml from "./acml";

/**
 * An object useful for requesting configuration data.
 */
export interface ConfigurationStore {
    /**
     * Requests all documents the requestor is allowed to see, by the names of
     * the templates used to create them.
     * 
     * @param names Names of templates associated with desired documents.
     */
    listDocumentsByTemplateNames(names: string[]): Promise<acml.Document[]>;
}