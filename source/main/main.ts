import * as acml from "./acml";
import * as ahfc from "ahfc-client";
import * as apes from "./apes";
import { ConfigurationSystem } from "./ConfigurationSystem";
import * as db from "./db";
import * as http from "./http";
import * as process from "process";
import { Settings } from "./Settings";

let serviceDiscovery;
let serviceInstanceName;
const serviceType = "_ahf-Configuration._http._tcp";

// Application start routine.
function start() {
    const appDataPath = Settings.resolveAppDataPath();
    const config = Settings.fromFileAt(appDataPath + "/config.json");

    serviceDiscovery = new ahfc.ServiceDiscoveryDNSSD(config.dnssd);
    serviceInstanceName = config.instanceName;

    serviceDiscovery.publish({
        serviceType,
        serviceName: serviceInstanceName,
        endpoint: config.endpoint,
        port: config.port,
        metadata: {
            path: "/",
            version: "" + process.env.npm_package_version
        }
    }).then(() => {
        const directory = new db.DirectoryLMDB(config.databasePath);
        new http.Server()
            // Document handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/documents",
                handler: (params, headers) => {
                    // TODO: Authenticate user and give reference to system.
                    const system = new ConfigurationSystem(directory, null);
                    const names = (params["document_names"] || "").split(",");
                    return system.management()
                        .removeDocuments(names)
                        .then(() => ({
                            code: http.Code.NoContent,
                            reason: "No content"
                        }));
                },
            })
            .handle({
                method: http.Method.GET,
                path: "/documents",
                handler: (params, headers) => {
                    // TODO: Authenticate user and give reference to system.
                    const system = new ConfigurationSystem(directory, null);
                    if (params["template_names"] !== undefined) {
                        const names = params["template_names"].split(",");
                        return system.store()
                            .listDocumentsByTemplateNames(names)
                            .then(documents => ({
                                code: http.Code.OK,
                                reason: "OK",
                                body: new apes.WritableArray(...documents),
                            }));
                    }
                    const names = (params["document_names"] || "").split(",");
                    // TODO: If current user lacks permission to access
                    // management service, try with store instead.
                    return system.management()
                        .listDocuments(names)
                        .then(documents => ({
                            code: http.Code.OK,
                            reason: "OK",
                            body: new apes.WritableArray(...documents),
                        }));
                },
            })
            .handle({
                method: http.Method.POST,
                path: "/documents",
                handler: (params, headers, body) => {
                    if (!Array.isArray(body)) {
                        return Promise.resolve({
                            code: http.Code.BadRequest,
                            reason: "Bad request",
                            body: new apes.WritableError("Not an array."),
                        });
                    }
                    try {
                        const documents = new Array<acml.Document>();
                        for (const item of body) {
                            documents.push(acml.Document.read(item));
                        }
                        // TODO: Authenticate user and give reference to system.
                        const system = new ConfigurationSystem(directory, null);
                        return system.management()
                            .addDocuments(documents)
                            .then(reports => reports
                                .reduce((sum, report) => {
                                    return sum + report.violations.length;
                                }, 0) === 0
                                ? {
                                    code: http.Code.Created,
                                    reason: "Created",
                                    body: new apes.WritableArray(...documents),
                                } : {
                                    code: http.Code.BadRequest,
                                    reason: "Bad request",
                                    body: new apes.WritableArray(...reports),
                                });
                    } catch (exception) {
                        return Promise.resolve({
                            code: http.Code.BadRequest,
                            reason: "Bad request",
                            body: new apes.WritableError(exception.message)
                        });
                    }
                },
            })

            // Rule handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/rules",
                handler: (params, headers) => {
                    // TODO: Authenticate user and give reference to system.
                    const system = new ConfigurationSystem(directory, null);
                    const names = (params["rule_names"] || "").split(",");
                    return system.management()
                        .removeRules(names)
                        .then(() => ({
                            code: http.Code.NoContent,
                            reason: "No content"
                        }));
                },
            })
            .handle({
                method: http.Method.GET,
                path: "/rules",
                handler: (params, headers) => {
                    // TODO: Authenticate user and give reference to system.
                    const system = new ConfigurationSystem(directory, null);
                    const names = (params["rule_names"] || "").split(",");
                    return system.management()
                        .listRules(names)
                        .then(rules => ({
                            code: http.Code.OK,
                            reason: "OK",
                            body: new apes.WritableArray(...rules),
                        }));
                },
            })
            .handle({
                method: http.Method.POST,
                path: "/rules",
                handler: (params, headers, body) => {
                    if (!Array.isArray(body)) {
                        return Promise.resolve({
                            code: http.Code.BadRequest,
                            reason: "Bad request",
                            body: new apes.WritableError("Not an array."),
                        });
                    }
                    try {
                        const rules = new Array<acml.Rule>();
                        for (const item of body) {
                            rules.push(acml.Rule.read(item));
                        }
                        // TODO: Authenticate user and give reference to system.
                        const system = new ConfigurationSystem(directory, null);
                        return system.management()
                            .addRules(rules)
                            .then(() => ({
                                code: http.Code.Created,
                                reason: "Created",
                                body: new apes.WritableArray(...rules),
                            }));
                    } catch (exception) {
                        return Promise.resolve({
                            code: http.Code.BadRequest,
                            reason: "Bad request",
                            body: new apes.WritableError(exception.message)
                        });
                    }
                },
            })

            // Template handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/templates",
                handler: (params, headers) => {
                    // TODO: Authenticate user and give reference to system.
                    const system = new ConfigurationSystem(directory, null);
                    const names = (params["template_names"] || "").split(",");
                    return system.management()
                        .removeTemplates(names)
                        .then(() => ({
                            code: http.Code.NoContent,
                            reason: "No content"
                        }));
                },
            })
            .handle({
                method: http.Method.GET,
                path: "/templates",
                handler: (params, headers) => {
                    // TODO: Authenticate user and give reference to system.
                    const system = new ConfigurationSystem(directory, null);
                    const names = (params["template_names"] || "").split(",");
                    return system.management()
                        .listTemplates(names)
                        .then(templates => ({
                            code: http.Code.OK,
                            reason: "OK",
                            body: new apes.WritableArray(...templates),
                        }));
                },
            })
            .handle({
                method: http.Method.POST,
                path: "/templates",
                handler: (params, headers, body) => {
                    if (!Array.isArray(body)) {
                        return Promise.resolve({
                            code: http.Code.BadRequest,
                            reason: "Bad request",
                            body: new apes.WritableError("Not an array."),
                        });
                    }
                    try {
                        const templates = new Array<acml.Template>();
                        for (const item of body) {
                            templates.push(acml.Template.read(item));
                        }
                        // TODO: Authenticate user and give reference to system.
                        const system = new ConfigurationSystem(directory, null);
                        return system.management()
                            .addTemplates(templates)
                            .then(() => ({
                                code: http.Code.Created,
                                reason: "Created",
                                body: new apes.WritableArray(...templates),
                            }));
                    } catch (exception) {
                        return Promise.resolve({
                            code: http.Code.BadRequest,
                            reason: "Bad request",
                            body: new apes.WritableError(exception.message)
                        });
                    }
                },
            })

            .listen(config.port);
    }, error => {
        console.log("Failed to setup Arrowhead Configuration System. Reason:");
        console.log(error);
        process.exit(1);
    });
}

// Application exit routine.
function exit() {
    serviceDiscovery.unpublish({
        serviceType,
        serviceName: serviceInstanceName
    }).then(() => {
        process.exit(0);
    }, error => {
        console.log(error);
        process.exit(2);
    });
}

// Bootstrapping routine.
{
    let didExit = false;
    const onExit = () => {
        if (didExit) {
            return;
        }
        didExit = true;
        exit();
    }

    process.on("SIGINT", onExit);
    process.on("SIGTERM", onExit);
    process.on("SIGHUP", onExit);

    try {
        start();
    } catch (error) {
        console.log("Failed to start Arrowhead Configuration System. Reason:");
        console.log(error);
    }
}
