import * as ahfc from "ahfc-client";
import { ConfigurationSystem } from "./ConfigurationSystem";
import * as db from "./db";
import * as http from "./http";
import * as process from "process";
import { Settings } from "./Settings";

let serviceDiscovery;
let serviceName;
const serviceType = "_ahf-Configuration._http._tcp";

// Application start routine.
function start() {
    const appDataPath = Settings.resolveAppDataPath();
    const config = Settings.fromFileAt(appDataPath + "/config.json");

    serviceDiscovery = new ahfc.ServiceDiscoveryDNSSD(config.dnssd);
    serviceName = config.instanceName;

    serviceDiscovery.publish({
        serviceType,
        serviceName,
        endpoint: config.endpoint,
        port: config.port,
    }).then(() => {
        const directory = new db.DirectoryLMDB(config.databasePath);
        new http.Server()
            // Document handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/documents",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })
            .handle({
                method: http.Method.GET,
                path: "/documents",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })
            .handle({
                method: http.Method.POST,
                path: "/documents",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })

            // Rule handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/rules",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })
            .handle({
                method: http.Method.GET,
                path: "/rules",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })
            .handle({
                method: http.Method.POST,
                path: "/rules",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })

            // Template handlers.
            .handle({
                method: http.Method.DELETE,
                path: "/templates",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })
            .handle({
                method: http.Method.GET,
                path: "/templates",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })
            .handle({
                method: http.Method.POST,
                path: "/templates",
                handler: (parameters, headers) => Promise.resolve({
                    code: http.Code.NotImplemented,
                    reason: "Not implemented",
                }),
            })

            .listen(config.port);
    }, error => {
        console.log("Failed to setup Arrowhead Configuration System.");
        console.log("Cause:\n%s", error);
        process.exit(1);
    });
}

// Application exit routine.
function exit() {
    serviceDiscovery.unpublish({ serviceType, serviceName }).then(() => {
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

    start();
}
