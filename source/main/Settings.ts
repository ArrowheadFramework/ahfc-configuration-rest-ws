import * as ahfc from "ahfc-client";
import * as crypto from "crypto";
import * as fs from "fs";
import * as process from "process";

/**
 * Holds application-wide settings.
 */
export class Settings {
    private static appDataPath: string;

    /**
     * Creates new application settings object.
     * 
     * @param dnssd DNS-SD related options.
     * @param databasePath Path to database folder.
     * @param endpoint Domain name at which this service is available, if known.
     * @param port Port number at which this service is available.
     * @param instanceName Service instance name.
     */
    public constructor(
        public readonly dnssd?: ahfc.ServiceDiscoveryDNSSDConfiguration,
        public readonly databasePath = Settings.resolveAppDataPath(),
        public readonly endpoint?: string,
        public readonly port = 8080,
        public readonly instanceName = crypto.randomBytes(4).toString("hex"),
    ) { }

    /**
     * Loads settings object from JSON file at given path.
     * 
     * @param path Path to existing or non-existing settings JSON file.
     * @return Settings object.
     */
    public static fromFileAt(path: string): Settings {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, "{}\n");
        }
        const file = fs.readFileSync(path, "utf8")
        let settings;
        try {
            settings = JSON.parse(file);
        } catch (error) {
            throw new SyntaxError(
                `Failed to parse JSON settings file (${path}): ${error}`
            );
        }
        return new Settings(
            settings.dnssd,
            settings.databasePath,
            settings.endpoint,
            settings.port,
            settings.instanceName
        );
    }

    /**
     * Resolves a file-system path to a suitable folder for storing application
     * settings. Also creates the folder if it does not exist.
     * 
     * @return Path to application data folder.
     */
    public static resolveAppDataPath(): string {
        if (this.appDataPath) {
            return this.appDataPath;
        }
        let path = process.env.APPDATA;
        if (!path) {
            if (process.platform === "darwin") {
                path = process.env.HOME + "/Library/Preferences";
            } else {
                path = process.env.HOME + "/.local";
                mkdirIfNotExists(path);
                path += "/share";
                mkdirIfNotExists(path);
            }
        }
        path += ("/ahfc-configuration-rest-ws");
        mkdirIfNotExists(path);
        return this.appDataPath = path;

        function mkdirIfNotExists(path: string) {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
        }
    }
}