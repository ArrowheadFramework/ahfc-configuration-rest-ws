import * as acml from "./acml";
import { ConfigurationStore } from "./ConfigurationStore";

class ConfigurationManagementLMDB implements ConfigurationStore {
    public listDocumentsByTemplateNames(
        names: string[]
    ): Promise<acml.Document[]> {
        throw new Error("Method not implemented.");
    }
}