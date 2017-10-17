import * as acml from "./acml";
import { ConfigurationManagement } from "./ConfigurationManagement";
import { ConfigurationStore } from "./ConfigurationStore";
import * as db from "./db";

/**
 * Represents the Arrowhead Configuration System.
 */
export class ConfigurationSystem {
    /**
     * Creates new configuration system handler.
     * 
     * @param directory Database in which system data is stored.
     */
    public constructor(
        private readonly directory: db.Directory
    ) { }

    /**
     * Requests access to management service.
     * 
     * Throws error if access is denied.
     * 
     * @param user Profile of requesting user.
     * @return Management service, if user is authorized to consume it.
     */
    public management(user: any): ConfigurationManagement {
        throw new Error("Not implemented");
    }

    /**
     * Requests access to store service.
     * 
     * Throws error if access is denied.
     * 
     * @param user Profile of requesting user.
     * @return Store service, if user is authorized to consume it.
     */
    public store(user: any): ConfigurationStore {
        throw new Error("Not implemented");
    }
}