import * as apes from "../apes";
import * as verify from "../util/verify";

/**
 * A configuration rule.
 * 
 * Configuration rules regulate which services may request what configuration
 * documents by template name. 
 */
export class Rule implements apes.Writable {
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
    ) { }

    /**
     * Attempts to create new rule from given source object.
     *
     * @param source Object to build rule from.
     * @return New rule.
     */
    public static read(source: object): Rule {
        return new Rule(
            verify.isString(source["RuleName"]),
            verify.isString(source["DocumentName"]),
            verify.isString(source["TemplateName"]),
            verify.isNumber(source["Priority"]),
            verify.isString(source["ServiceName"]),
        );
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