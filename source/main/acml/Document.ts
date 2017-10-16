import * as apes from "../apes";

/**
 * A configuration document.
 */
export class Document implements apes.Writable {
    /**
     * Creates new configuration document.
     * 
     * @param template The name of the template used to create this document. 
     * @param name Name of document.
     * @param body Document contents.
     */
    public constructor(
        public readonly template: string,
        public readonly name: string,
        public readonly body: apes.Writable,
    ) { }

    write(writer: apes.Writer) {
        writer.writeMap(writer => writer
            .addText("TemplateName", this.template)
            .addText("DocumentName", this.name)
            .add("Body", this.body));
    }
}