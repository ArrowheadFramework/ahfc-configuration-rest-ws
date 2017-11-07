import * as apes from "../apes";
import * as verify from "../util/verify";

/**
 * A configuration rule.
 * 
 * Configuration rules regulate which services may request what configuration
 * documents by template name. 
 */
export class Rule implements apes.Writable {
    public readonly isWritable = true;

    /**
     * Creates new configuration rule.
     * 
     * @param name Rule name.
     * @param document Fully qualified name of document subject to this rule.
     * @param template Fully qualified name of template used to create document. 
     * @param priority Rule priority. A higher value gives higher precedence.
     * @param service A fully or partially qualified service name.
     */
    public constructor(
        public readonly name: string,
        public readonly document: string,
        public readonly template: string,
        public readonly priority: number,
        public readonly service: string,
    ) {
        if (name.endsWith(".")) {
            throw new Error(
                "Rule name not fully qualified: " + name
            );
        }
        if (document.endsWith(".")) {
            throw new Error(
                "Rule document name not fully qualified: " + document
            );
        }
        if (template.endsWith(".")) {
            throw new Error(
                "Rule template name not fully qualified: " + template
            );
        }
    }

    /**
     * Attempts to create new rule from given source object.
     *
     * @param source Object to build rule from.
     * @return New rule.
     */
    public static read(source: object): Rule {
        return new Rule(
            isValidName(source["RuleName"], "Rule"),
            isValidName(source["DocumentName"], "Document"),
            isValidName(source["TemplateName"], "Template"),
            verify.isNumber(source["Priority"]),
            verify.isString(source["ServiceName"]),
        );

        function isValidName(name: string, type: string): string {
            return verify.isValid(name,
                name => typeof name === "string" && name.trim().length > 0
                    && !name.endsWith("."),
                `${type} name must be fully qualified: ` +
                JSON.stringify(source))
        }
    }

    public write(writer: apes.Writer) {
        writer.writeMap(writer => writer
            .addText("RuleName", this.name)
            .addText("DocumentName", this.document)
            .addText("TemplateName", this.template)
            .addNumber("Priority", this.priority)
            .addText("ServiceName", this.service));
    }
}