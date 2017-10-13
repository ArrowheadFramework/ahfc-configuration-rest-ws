import * as acml from "./acml";
import { ConfigurationManagement } from "./ConfigurationManagement";

class ConfigurationManagementLMDB implements ConfigurationManagement {
    addDocuments(documents: acml.Document[]): Promise<acml.Report[]> {
        throw new Error("Method not implemented.");
    }

    listDocuments(names: string[]): Promise<acml.Document[]> {
        throw new Error("Method not implemented.");
    }

    removeDocuments(names: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }

    addTemplates(templates: acml.Template[]): Promise<void> {
        throw new Error("Method not implemented.");
    }

    listTemplates(names: string[]): Promise<acml.Template[]> {
        throw new Error("Method not implemented.");
    }

    removeTemplates(names: string[]): Promise<void> {
        throw new Error("Method not implemented.");
    }
}