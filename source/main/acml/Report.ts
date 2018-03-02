import * as apes from "../apes";
import { TemplateCondition } from "./Template";

/**
 * A description of what, if any, conditions imposed by a template are violated
 * by some document.
 * 
 * If a report contains exactly zero (0) violations, it is said to refer to a
 * _sound_ document.
 */
export class Report implements apes.Writable {
    public readonly isWritable = true;

    /**
     * Creates new configuration document report.
     * 
     * @param document Name of document.
     * @param template Name of template document was compared to.
     * @param violations Any template violations in document.
     */
    public constructor(
        public readonly document: string,
        public readonly template: string,
        public readonly violations: Violation[],
    ) {
        if (document.endsWith(".")) {
            throw new Error(
                "Report document name not fully qualified: " + document
            );
        }
        if (template && template.endsWith(".")) {
            throw new Error(
                "Report template name not fully qualified: " + template
            );
        }
    }

    write(writer: apes.Writer) {
        writer.writeMap(writer => {
            writer.addText("DocumentName", this.document);
            if (this.template) {
                writer.addText("TemplateName", this.template);
            } else {
                writer.addNull("TemplateName");
            }
            writer.addList("Violations", writer => this.violations
                .forEach(violation => writer.addMap(writer => {
                    writer.addText("Condition", violation.condition);
                    if (violation.path) {
                        writer.addText("Path", violation.path);
                    }
                    if (violation.error) {
                        writer.addText("Exception", violation.error.toString());
                    }
                })))
        });
    }
}

/**
 * A description of a violation of a particular template entity condition.
 */
export interface Violation {
    /**
     * Specifies some violated condition or rule.
     */
    condition: TemplateCondition;

    /**
     * Path to template entity that owns violated condition, if relevant.
     */
    path?: string;

    /**
     * Provides additional data in case of an unexpected condition evaluation
     * failure.
     */
    error?: any;
}
