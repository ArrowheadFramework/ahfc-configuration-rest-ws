import * as acml from "./acml";
import * as apes from "./apes";
import { ConfigurationManagement } from "./ConfigurationManagement";
import { ConfigurationStore } from "./ConfigurationStore";
import * as db from "./db";
import * as io from "./io";

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
                const map = new Map<string, acml.Document[]>();
                for (const document of documents) {
                    const path = normalizePath(document.template);
                    map.set(path, (map.get(path) || []).concat(document));
                }
                return this
                    .listTemplates(Array.from(map.keys()))
                    .then(templates => templates.reduce((reports, template) => {
                        const documents = map.get(template.name) || [];
                        for (let document; (document = documents.pop());) {
                            reports.push(document);
                        }
                        return reports;
                    }, new Array<acml.Report>()))
                    .then(reports => {
                        for (const documents of map.values()) {
                            for (const document of documents) {
                                reports.push(new acml.Report(
                                    document.name,
                                    document.template,
                                    [{
                                        path: ".",
                                        condition: "template != undefined",
                                    }]
                                ));
                            }
                        }
                        return reports;
                    });
            }

            listDocuments(names: string[]): Promise<acml.Document[]> {
                return list(".d", names, acml.Document.read);
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
                return list(".r", names, acml.Rule.read);
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
                return list(".t", names, acml.Template.read);
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

        function add(
            prefix: string,
            entries: { path: string, value: apes.Writable }[]
        ): Promise<void> {
            const sink = new io.WritableBuffer(128);
            const writer = new apes.WriterJSON(sink);
            return directory.add(entries.map(entry => {
                entry.value.write(writer);
                return {
                    path: prefixPath(prefix, entry.path),
                    value: sink.pop(),
                };
            }));
        }

        function list<T>(
            prefix: string,
            paths: string[],
            read: (value: object) => T
        ): Promise<T[]> {
            return directory
                .list(paths.map(path => prefixPath(prefix, path)))
                .then(entries => new Promise<T[]>((resolve, reject) => {
                    try {
                        resolve(entries.map(entry => {
                            return read(JSON.parse(entry.value.toString()));
                        }));
                    } catch (exception) {
                        reject(exception);
                    }
                }));
        }

        function remove(
            prefix: string,
            paths: string[]
        ): Promise<void> {
            paths = paths.map(path => prefixPath(prefix, path));
            return directory.remove(paths);
        }

        function normalizePath(path: string): string {
            return (path.startsWith(".") ? "" : ".") + path;
        }

        function prefixPath(prefix: string, path: string): string {
            return prefix + normalizePath(path);
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