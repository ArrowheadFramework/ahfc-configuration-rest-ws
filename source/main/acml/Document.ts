import * as apes from "../apes";
import * as verify from "../util/verify";

/**
 * A configuration document.
 */
export class Document implements apes.Writable {
    public readonly isWritable = true;

    /**
     * Creates new configuration document.
     * 
     * @param name Name of document.
     * @param body Document contents.
     * @param template Document template, if any.
     */
    public constructor(
        public readonly name: string,
        public readonly body: object,
        public readonly template?: string,
    ) {
        if (name.endsWith(".")) {
            throw new Error(
                "Document name not fully qualified: " + name
            );
        }
        if (template && template.endsWith(".")) {
            throw new Error(
                "Document template name not fully qualified: " + template
            );
        }
    }

    /**
     * Attempts to create new document from given source object.
     *
     * @param source Object to build document from.
     * @return New document.
     */
    public static read(source: object): Document {
        return new Document(
            verify.isString(source["DocumentName"]),
            verify.isObject(source["Body"]),
            verify.isStringOrNothing(source["TemplateName"])
        );
    }

    public write(writer: apes.Writer) {
        writer.writeMap(writer => writer
            .add("TemplateName", this.template)
            .addText("DocumentName", this.name)
            .add("Body", this.body));
    }
}