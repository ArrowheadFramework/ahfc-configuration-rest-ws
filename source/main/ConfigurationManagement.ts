import * as acml from "./acml";

/**
 * An object useful for managing configuration data.
 */
export interface ConfigurationManagement {
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
    addDocuments(documents: acml.Document[]): Promise<acml.Report[]>;

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
    listDocuments(names: string[]): Promise<acml.Document[]>;

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

    /**
     * Adds given array of rules.
     *
     * If an added rule has a rule name equal to any existing rule, the
     * existing rule is replaced.
     *
     * @param rules Rules to add.
     * @return A promise resolved with nothing when the operation is completed.
     */
    addRules(rules: acml.Rule[]): Promise<void>;

    /**
     * Retrieves all known rules with names matching those given.
     *
     * The provided names may be fully or partially qualified. In case of any
     * partially qualified name, all rules that begins with the same path
     * segments are considered matches. Note that a single empty name, or a
     * array of zero names, will match all known rules.
     *
     * @param names An array of fully or partially qualified rule names.
     * @return A list of rules.
     */
    listRules(names: string[]): Promise<acml.Rule[]>;

    /**
     * Removes all known rules with names matching those given.
     *
     * The provided names may be fully or partially qualified. In case of any
     * partially qualified name, all rules that begins with the same path
     * segments are considered matches. Note that a single empty name, or a
     * array of zero names, will match all known rules.
     *
     * @param names An array of fully or partially qualified rule names.
     * @return A promise resolved with nothing when the operation is completed.
     */
    removeRules(names: string[]): Promise<void>;

    /**
     * Adds given array of templates.
     *
     * If an added template has a template name equal to any existing template,
     * the existing template is replaced.
     *
     * @param templates Templates to add.
     * @return A promise resolved with nothing when the operation is completed.
     */
    addTemplates(templates: acml.Template[]): Promise<void>;

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
    listTemplates(names: string[]): Promise<acml.Template[]>;

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
    removeTemplates(names: string[]): Promise<void>;
}