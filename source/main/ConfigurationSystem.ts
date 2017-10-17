import * as acml from "./acml";
import * as apes from "./apes";
import { ConfigurationManagement } from "./ConfigurationManagement";
import { ConfigurationStore } from "./ConfigurationStore";
import * as db from "./db";
import * as io from "./io";

type WritableEntry = { path: string, value: apes.Writable };

/**
 * Represents the Arrowhead Configuration System.
 */
export class ConfigurationSystem {
    private readonly serviceManagement: ConfigurationManagement;
    private readonly serviceStore: ConfigurationStore;

    /**
     * Creates new configuration system handler.
     * 
     * @param directory Database in which system data is stored.
     */
    public constructor(directory: db.Directory) {
        this.serviceManagement = new class implements ConfigurationManagement {
            addDocuments(documents: acml.Document[]): Promise<acml.Report[]> {
                throw new Error("Method not implemented.");
            }

            listDocuments(names: string[]): Promise<acml.Document[]> {
                return list(".d", names)
                    .then(entries => entries.map(acml.Document.read));
            }

            removeDocuments(names: string[]): Promise<void> {
                return remove(".d", names);
            }

            addRules(rules: acml.Rule[]): Promise<void> {
                return add(".r", rules.map(rule => ({
                    path: rule.name,
                    value: rule,
                })));
            }

            listRules(names: string[]): Promise<acml.Rule[]> {
                return list(".r", names)
                    .then(entries => entries.map(acml.Rule.read));
            }

            removeRules(names: string[]): Promise<void> {
                return remove(".r", names);
            }

            addTemplates(templates: acml.Template[]): Promise<void> {
                return add(".t", templates.map(template => ({
                    path: template.name,
                    value: template,
                })));
            }

            listTemplates(names: string[]): Promise<acml.Template[]> {
                return list(".t", names)
                    .then(entries => entries.map(acml.Template.read));
            }

            removeTemplates(names: string[]): Promise<void> {
                return remove(".t", names);
            }
        };

        this.serviceStore = new class implements ConfigurationStore {
            listDocumentsByTemplateNames(
                names: string[]
            ): Promise<acml.Document[]> {
                throw new Error("Method not implemented.");
            }
        };

        function add(prefix: string, entries: WritableEntry[]): Promise<void> {
            const sink = new io.WritableBuffer(128);
            const writer = new apes.WriterJSON(sink);
            return directory.add(entries.map(entry => {
                entry.value.write(writer);
                return {
                    path: addPrefix(prefix, entry.path),
                    value: sink.pop(),
                };
            }));
        }

        function list(prefix: string, paths: string[]): Promise<object[]> {
            return directory
                .list(paths.map(path => addPrefix(prefix, path)))
                .then(entries => entries.map(entry => {
                    return JSON.parse(entry.value.toString());
                }));
        }

        function remove(prefix: string, paths: string[]): Promise<void> {
            return directory
                .remove(paths.map(path => addPrefix(prefix, path)));
        }

        function addPrefix(prefix: string, path: string): string {
            return prefix + (path.startsWith(".") ? "" : ".") + path;
        }
    }

    /**
     * Requests access to management service.
     * 
     * Throws error if access is denied.
     * 
     * @param user Authorization profile of requesting user.
     * @return Management service, if user is authorized to consume it.
     */
    public management(user: any): ConfigurationManagement {
        // TODO: Check user authorization.
        return this.serviceManagement;
    }

    /**
     * Requests access to store service.
     * 
     * Throws error if access is denied.
     * 
     * @param user Authorization profile of requesting user.
     * @return Store service, if user is authorized to consume it.
     */
    public store(user: any): ConfigurationStore {
        // TODO: Check user authorization.
        return this.serviceStore;
    }
}