import * as acml from "./acml";

/**
 * An object useful for managing configuration data.
 */
export interface ConfigurationManagement {
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