import * as acml from "./acml";
import * as apes from "./apes";
import { ConfigurationManagement } from "./ConfigurationManagement";
import { ConfigurationStore } from "./ConfigurationStore";
import * as db from "./db";
import * as io from "./io";

interface NamedWritable extends apes.Writable {
    name: string;
}

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
     * @param user Authorization profile of user using system.
     */
    public constructor(directory: db.Directory, user: any) {
        this.serviceManagement = new class implements ConfigurationManagement {
            addDocuments(documents: acml.Document[]): Promise<acml.Report[]> {
                return directory.write(writer =>
                    validateDocuments(writer, documents)
                        .then(reports => {
                            const violationCount = reports
                                .reduce((violationCount, report) => {
                                    return violationCount +
                                        report.violations.length;
                                }, 0);
                            return violationCount === 0
                                ? add(writer, ".d", documents)
                                    .then(() => reports)
                                : reports;
                        }));
            }

            listDocuments(names: string[]): Promise<acml.Document[]> {
                return directory.read(reader =>
                    list(reader, ".d", names, acml.Document.read));
            }

            removeDocuments(names: string[]): Promise<void> {
                return directory.write(writer => remove(writer, ".d", names));
            }

            addRules(rules: acml.Rule[]): Promise<void> {
                return directory.write(writer =>
                    add(writer, ".r", rules)
                        .then(() => writer.add(rules.map(rule => ({
                            path: prefixPath(".rt", rule.template),
                            value: Buffer.from(prefixPath(".r", rule.name)),
                        })))));
            }

            listRules(names: string[]): Promise<acml.Rule[]> {
                return directory.read(reader =>
                    list(reader, ".r", names, acml.Rule.read));
            }

            removeRules(names: string[]): Promise<void> {
                return directory.write(writer =>
                    list(writer, ".r", names, acml.Rule.read)
                        .then(rules => remove(writer, ".rt", rules
                            .map(rule => rule.template)))
                        .then(() => remove(writer, ".r", names)));
            }

            addTemplates(templates: acml.Template[]): Promise<void> {
                return directory.write(writer => add(writer, ".t", templates));
            }

            listTemplates(names: string[]): Promise<acml.Template[]> {
                return directory.read(reader =>
                    list(reader, ".t", names, acml.Template.read));
            }

            removeTemplates(names: string[]): Promise<void> {
                return directory.write(writer => remove(writer, ".t", names));
            }
        };

        this.serviceStore = new class implements ConfigurationStore {
            listDocumentsByTemplateNames(names): Promise<acml.Document[]> {
                return directory.read(reader => reader
                    .list(names.map(name => prefixPath(".rt", name)))
                    .then(entries => list(reader, ".r", entries
                        .map(entry => entry.value.toString()), acml.Rule.read))
                    // TODO: Only return documents where the rule in question
                    // has a service name matching that of the requesting user.
                    .then(rules => list(reader, ".d", rules
                        .map(rule => rule.document), acml.Document.read)));
            }
        };

        function add(writer, prefix, values: NamedWritable[]): Promise<void> {
            const sink = new io.WritableBuffer(128);
            const sinkWriter = new apes.WriterJSON(sink);
            return writer.add(values.map(entry => {
                entry.write(sinkWriter);
                return {
                    path: prefixPath(prefix, entry.name),
                    value: sink.pop(),
                };
            }));
        }

        function list<T>(reader, prefix, paths, read: (x) => T): Promise<T[]> {
            return reader
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

        function remove(writer, prefix, paths): Promise<void> {
            return writer.remove(paths.map(path => prefixPath(prefix, path)));
        }

        function normalizePath(path: string): string {
            return (path.startsWith(".") ? "" : ".") + path;
        }

        function prefixPath(prefix: string, path: string): string {
            return prefix + normalizePath(path);
        }

        function validateDocuments(reader, documents): Promise<acml.Report[]> {
            const index = new Map<string, acml.Document[]>();
            for (const document of documents) {
                const path = normalizePath(document.template);
                index.set(path, (index.get(path) || []).concat(document));
            }
            const templatePaths = Array.from(index.keys());
            return list(reader, ".t", templatePaths, acml.Template.read)
                .then(templates => templates.reduce((reports, template) => {
                    const path = normalizePath(template.name);
                    const documents = index.get(path) || [];
                    let document: acml.Document;
                    while (document = documents.pop()) {
                        reports.push(template.validate(document));
                    }
                    return reports;
                }, new Array<acml.Report>()))
                .then(reports => {
                    for (const documents of index.values()) {
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
    }

    /**
     * Requests access to management service.
     * 
     * Throws error if access is denied.
     *
     * @return Management service, if user is authorized to consume it.
     */
    public management(): ConfigurationManagement {
        // TODO: Check user authorization.
        return this.serviceManagement;
    }

    /**
     * Requests access to store service.
     * 
     * Throws error if access is denied.
     * 
     * @return Store service, if user is authorized to consume it.
     */
    public store(): ConfigurationStore {
        // TODO: Check user authorization.
        return this.serviceStore;
    }
}