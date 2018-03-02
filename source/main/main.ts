import * as acml from "./acml";
import * as ahfc from "ahfc-client";
import * as apes from "./apes";
import { ConfigurationSystem } from "./ConfigurationSystem";
import * as db from "./db";
import * as http from "./http";
import * as process from "process";
import { Settings } from "./Settings";

/**
 * Application main class.
 */
class Application {
    private static readonly serviceTypes: string[] = [
        "_ahfc-ConfigurationManagement._http._tcp",
        "_ahfc-ConfigurationStore._http._tcp"
    ];

    private readonly isDiscoverable: boolean;

    private serviceDiscovery: ahfc.ServiceDiscoveryDNSSD;
    private serviceInstanceName: string;

    /**
     * Creates new application.
     * 
     * @param argv Application command line arguments.
     */
    constructor(argv = process.argv.slice(2)) {
        this.isDiscoverable = argv.find(arg => {
            return arg === "--not-discoverable" || arg === "-d";
        }) === undefined;
    }

    /// Application start routine.
    public start(): Promise<void> {
        try {
            const appDataPath = Settings.resolveAppDataPath();
            const settingsPath = appDataPath + "/config.json";
            const settings = Settings.fromFileAt(settingsPath);
            const version = process.env.npm_package_version;

            console.log(
                `Arrowhead Configuration System ${version}\n` +
                `  Configuration path: ${settingsPath}\n` +
                `  Database path: ${settings.databasePath}\n` +
                `  Endpoint to self: ${settings.endpoint}:${settings.port}\n` +
                `  Instance name: ${settings.instanceName}\n` +
                `  Discoverable: ${this.isDiscoverable ? "Yes" : "No"}\n`);

            return this.registerService(settings)
                .then(() => this.loadHTTPHandlers(settings));
        } catch (error) {
            return Promise.reject(error);
        }
    }

    private registerService(settings: Settings): Promise<void> {
        if (!this.isDiscoverable) {
            return Promise.resolve();
        }
        console.log("+ Registering with service registry at %s ...",
            ((settings.dnssd || {}).nameServers || []).join(", "));
        this.serviceDiscovery = new ahfc.ServiceDiscoveryDNSSD(settings.dnssd);
        this.serviceInstanceName = settings.instanceName;

        return Promise.all(Application.serviceTypes
            .reduce((promises, serviceType) =>
                promises.concat(this.serviceDiscovery.publish({
                    serviceType,
                    serviceName: this.serviceInstanceName,
                    endpoint: settings.endpoint,
                    port: settings.port,
                    metadata: {
                        path: "/",
                        version: "" + process.env.npm_package_version
                    }
                }).then(() => console.log(
                    `+ Published: ${this.serviceInstanceName}.${serviceType}`)))
                , new Array<Promise<any>>()))
            .then(() => undefined);
    }

    private loadHTTPHandlers(settings: Settings) {
        type AuthenticatedHandler = (
            params: string[],
            headers: string[],
            system: ConfigurationSystem,
            body?: object
        ) => PromiseLike<http.Response>;

        const directory = db.DirectoryLMDB.open(settings.databasePath);
        const authenticate = (handler: AuthenticatedHandler) => {
            return (params, headers, body) => {
                // TODO: Authenticate user and give user to system.
                const system = new ConfigurationSystem(directory, null);
                try {
                    return handler(params, headers, system, body);

                } catch (error) {
                    console.log(error);
                    return Promise.resolve({
                        code: http.Code["Internal Server Error"]
                    });
                }
            };
        };
        new http.Server()
            // Document handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/documents",
                handler: authenticate((params, headers, system) => {
                    const names = (params["document_names"] || "").split(",");
                    // TODO: Error code "Unauthorized" if access rule fails.
                    return system.store()
                        .removeDocuments(names)
                        .then(() => ({ code: http.Code["No Content"] }));
                })
            })
            .handle({
                method: http.Method.GET,
                path: "/documents",
                handler: authenticate((params, headers, system) => {
                    const f = (params["inline"] || "").toLowerCase() === "true"
                        ? (document) => document.body
                        : (document) => document;
                    const names = (params["document_names"] || "").split(",");
                    // TODO: Error code "Unauthorized" if access rule fails.
                    return system.store()
                        .listDocuments(names)
                        .then(documents => ({
                            code: http.Code["OK"],
                            body: documents.reduce((array, document) => {
                                array.push(f(document));
                                return array;
                            }, new apes.WritableArray())
                        }));
                }),
            })
            .handle({
                method: http.Method.PATCH,
                path: "/documents",
                handler: authenticate((params, headers, system, body) => {
                    if (!Array.isArray(body)) {
                        return Promise.resolve({
                            code: http.Code["Bad Request"],
                            body: new apes.WritableError("Not an array."),
                        });
                    }
                    const patches = new Array<acml.Patch>();
                    for (const item of body) {
                        patches.push(acml.Patch.read(item));
                    }
                    // TODO: Error code "Unauthorized" if access rule fails.
                    return system.store()
                        .patchDocuments(patches)
                        .then(reports => reports
                            .reduce((sum, report) => {
                                return sum + report.violations.length;
                            }, 0) === 0
                            ? {
                                code: http.Code["OK"],
                                body: new apes.WritableArray(...patches),
                            } : {
                                code: http.Code["Bad Request"],
                                body: new apes.WritableArray(...reports),
                            });
                }),
            })
            .handle({
                method: http.Method.POST,
                path: "/documents",
                handler: authenticate((params, headers, system, body) => {
                    if (!Array.isArray(body)) {
                        return Promise.resolve({
                            code: http.Code["Bad Request"],
                            body: new apes.WritableError("Not an array."),
                        });
                    }
                    const documents = new Array<acml.Document>();
                    for (const item of body) {
                        documents.push(acml.Document.read(item));
                    }
                    // TODO: Error code "Unauthorized" if access rule fails.
                    return system.store()
                        .addDocuments(documents)
                        .then(reports => reports
                            .reduce((sum, report) => {
                                return sum + report.violations.length;
                            }, 0) === 0
                            ? {
                                code: http.Code["Created"],
                                body: new apes.WritableArray(...documents),
                            } : {
                                code: http.Code["Bad Request"],
                                body: new apes.WritableArray(...reports),
                            });
                }),
            })

            // Template handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/templates",
                handler: authenticate((params, headers, system) => {
                    const names = (params["template_names"] || "").split(",");
                    // TODO: Error code "Unauthorized" if access rule fails.
                    return system.management()
                        .removeTemplates(names)
                        .then(() => ({ code: http.Code["No Content"] }));
                }),
            })
            .handle({
                method: http.Method.GET,
                path: "/templates",
                handler: authenticate((params, headers, system) => {
                    const names = (params["template_names"] || "").split(",");
                    // TODO: Error code "Unauthorized" if access rule fails.
                    return system.management()
                        .listTemplates(names)
                        .then(templates => ({
                            code: http.Code["OK"],
                            body: new apes.WritableArray(...templates),
                        }));
                }),
            })
            .handle({
                method: http.Method.POST,
                path: "/templates",
                handler: authenticate((params, headers, system, body) => {
                    if (!Array.isArray(body)) {
                        return Promise.resolve({
                            code: http.Code["Bad Request"],
                            body: new apes.WritableError("Not an array."),
                        });
                    }
                    const templates = new Array<acml.Template>();
                    for (const item of body) {
                        templates.push(acml.Template.read(item));
                    }
                    // TODO: Error code "Unauthorized" if access rule fails.
                    return system.management()
                        .addTemplates(templates)
                        .then(() => ({
                            code: http.Code["Created"],
                            body: new apes.WritableArray(...templates),
                        }));
                }),
            })

            .listen(settings.port);
    }

    /// Application exit routine.
    public exit(): Promise<void> {
        let after: Promise<any>;
        if (this.isDiscoverable) {
            after = Promise.all(Application.serviceTypes
                .reduce((promises, serviceType) =>
                    promises.concat(this.serviceDiscovery.unpublish({
                        serviceType,
                        serviceName: this.serviceInstanceName
                    }).then(() => console.log(
                        `+ Unpublished: ${this.serviceInstanceName}.${serviceType}`
                    ))), new Array<Promise<any>>()));
        } else {
            after = Promise.resolve();
        }
        return after.then(() => console.log("+ Exit."));
    }
}

// Bootstrap.
{
    const application = new Application();

    let didExit = false;
    const onExit = () => {
        if (didExit) {
            return;
        }
        didExit = true;
        console.log();
        application.exit()
            .then(() => process.exit(0))
            .catch(error => {
                console.log("Orderly exit failed.");
                console.log("Reason:");
                console.log(error);
                process.exit(2);
            });
    }

    process.on("SIGINT", onExit);
    process.on("SIGTERM", onExit);
    process.on("SIGHUP", onExit);

    application.start()
        .catch(error => {
            console.log("Failed to start Arrowhead Configuration System.");
            console.log("Reason:");
            console.log(error);
            process.exit(1);
        });
}
