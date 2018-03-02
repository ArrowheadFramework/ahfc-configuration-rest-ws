import * as acml from "./acml";
import * as apes from "./apes";
import { ConfigurationManagement } from "./ConfigurationManagement";
import { ConfigurationStore } from "./ConfigurationStore";
import * as db from "./db";
import * as dpath from "./util/dpath";
import * as io from "./io";

interface Validation {
    reports: Map<string, acml.Report>,
    violationCount: number,
}

/**
 * Represents the Arrowhead Configuration System.
 */
export class ConfigurationSystem {
    private readonly _management: ConfigurationManagement;
    private readonly _store: ConfigurationStore;

    /**
     * Creates new configuration system handler.
     * 
     * @param directory Database in which system data is stored.
     * @param user Authorization profile of user using system.
     */
    public constructor(directory: db.Directory, user: any) {
        const sink = new io.WritableBuffer(128);
        const sinkWriter = new apes.WriterJSON(sink);

        // Directory of documents.
        const dirDocuments = directory.enter(".d").map(
            (entry: db.DirectoryEntry) => {
                const object = JSON.parse(entry.value.toString());
                return acml.Document.read(object);
            },
            (document: acml.Document) => {
                document.write(sinkWriter);
                return { path: document.name, value: sink.pop() };
            });

        // Directory of templates.
        const dirTemplates = directory.enter(".t").map(
            (entry: db.DirectoryEntry) => {
                const object = JSON.parse(entry.value.toString());
                return acml.Template.read(object);
            },
            (template: acml.Template) => {
                template.write(sinkWriter);
                return { path: template.name, value: sink.pop() };
            });

        // Management implementation.
        this._management = new class implements ConfigurationManagement {
            addTemplates(templates: acml.Template[]): Promise<void> {
                return dirTemplates.write(writer => writer.add(templates));
            }

            listTemplates(names: string[]): Promise<acml.Template[]> {
                return dirTemplates.read(reader => reader.list(names));
            }

            removeTemplates(names: string[]): Promise<void> {
                return dirTemplates.write(writer => writer.remove(names));
            }
        }

        // Store implementation.
        // TODO: Can this implementation be made more pretty?
        this._store = new class implements ConfigurationStore {
            public addDocuments(documents: acml.Document[]): Promise<acml.Report[]> {
                // TODO: Check if user may add documents.
                return this.validateDocuments(documents)
                    .then(validation => validation.violationCount === 0
                        ? dirDocuments.write(writer => writer.add(documents)
                            .then(_ => validation.reports.values()))
                        : validation.reports.values())
                    .then(reports => Array.from(reports));
            }

            private validateDocuments(documents: acml.Document[]): Promise<Validation> {
                const templateToDocuments = documents
                    .filter(document => document.template)
                    .reduce((tmap, document) => {
                        const path = dpath.normalize(document.template);
                        tmap.set(path, (tmap.get(path) || []).concat(document));
                        return tmap;
                    }, new Map<string, acml.Document[]>());

                let violationCount = 0;

                return dirTemplates
                    .read(reader => reader.list(templateToDocuments.keys()))
                    .then(templates => templates.reduce((dmap, template) => {
                        const path = dpath.normalize(template.name);
                        const documents = templateToDocuments.get(path) || [];
                        for (let document; document = documents.pop();) {
                            const report = template.validate(document);
                            violationCount += report.violations.length;
                            dmap.set(document.name, report);
                        }
                        for (const documents of templateToDocuments.values()) {
                            for (const document of documents) {
                                violationCount += 1;
                                dmap.set(document.name, document.report({
                                    condition: `TemplateExists("${document.template}")`,
                                }));
                            }
                        }
                        return dmap;
                    }, new Map<string, acml.Report>()))
                    .then(reports => ({ reports, violationCount }));
            }

            public listDocuments(names: string[]): Promise<acml.Document[]> {
                // TODO: Only return documents user is allowed to see.
                return dirDocuments.read(reader => reader.list(names));
            }

            public patchDocuments(patches: acml.Patch[]): Promise<acml.Report[]> {
                // TODO: Only allow if user may apply every patch.
                return dirDocuments
                    .read(reader => {
                        const paths = patches
                            .map(patch => patch.name)
                            .filter(name => name);
                        return reader.list(paths);
                    })
                    .then(documents => {
                        const pmap = patches.reduce((map, patch) => {
                            map.set(dpath.normalize(patch.name), patch);
                            return map;
                        }, new Map<string, acml.Patch>());

                        for (const document of documents) {
                            const patch = pmap.get(dpath.normalize(document.name));
                            pmap.delete(dpath.normalize(patch.name));
                            patch.apply(document);
                        }

                        return this.validateDocuments(documents)
                            .then(validation => {
                                for (const [_, patch] of pmap) {
                                    let report = validation.reports.get(dpath.normalize(patch.name));
                                    if (!report) {
                                        report = patch.report();
                                        validation.reports.set(dpath.normalize(patch.name), report);
                                    }
                                    validation.violationCount += 1;
                                    report.violations.push({
                                        condition: `DocumentExists("${patch.name}")`
                                    });
                                }
                                return validation.violationCount === 0
                                    ? dirDocuments.write(writer => writer.add(documents)
                                        .then(_ => validation.reports.values()))
                                    : validation.reports.values();
                            });
                    })
                    .then(reports => Array.from(reports));
            }

            public removeDocuments(names: string[]): Promise<void> {
                // TODO: Check if user may remove documents.
                return dirDocuments.write(writer => writer.remove(names));
            }
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
        // TODO: Check user authorization. If exists, user may do anything the
        // returned interface provides.
        return this._management;
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
        return this._store;
    }
}