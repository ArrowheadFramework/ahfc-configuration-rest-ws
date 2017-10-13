import { Document } from "./Document";
import { Report, Violation } from "./Report";
import * as vm from "vm";
import { Writable, Writer, WriterMap } from "../apes";

/**
 * A configuration template.
 *
 * Configuration templates are descriptions of what may and may not be part of
 * a configuration document.
 */
export class Template implements Writable {
    /**
     * Template name.
     */
    public readonly name: string;

    /**
     * Template specification.
     */
    public readonly body: TemplateBody;

    /**
     * Creates new template with given name and specification.
     *
     * @param name Name of template.
     * @param body Template specification.
     */
    public constructor(name: string, body: TemplateBody) {
        this.name = name;
        this.body = body;
    }

    /**
     * Determines whether given document is sound in relation to this template.
     *
     * @param document Document to validate.
     * @return Validation report.
     */
    public validate(document: Document): Report {
        return new Report(
            document.name,
            this.name,
            this.name === document.template
                ? this.body.validate("", document.body, "", -1)
                : [{
                    path: "",
                    condition: "document.TemplateName != template.TemplateName"
                }],
        );
    }

    write(writer: Writer) {
        writer.writeMap(writer => writer
            .addText("TemplateName", this.name)
            .addWritable("Body", this.body));
    }
}

/**
 * A template specification.
 */
export type TemplateBody = TemplateField;

/**
 * A template field condition.
 */
export type TemplateCondition = string;

/**
 * A component of a template specification.
 */
export abstract class TemplateField implements Writable {
    /**
     * Human and machine readable field identifier.
     */
    public readonly name: string;

    /**
     * Conditions that must be satisfied for a document instance of this field
     * to be considered sound.
     */
    public readonly conditions?: TemplateCondition[];

    /**
     * Validates given document entity.
     *
     * @param entity Part of document body to validate.
     * @return Array of any violations.
     */
    public validate(
        path: string,
        entity: any,
        indexOrKey: number | string,
        length: number
    ): Violation[] {
        return (this.conditions || [])
            .reduce((violations, condition) => {
                const context: { __lambda: Function } = {
                    __lambda: undefined
                };
                try {
                    vm.runInNewContext("__lambda = " + condition, context, {
                        timeout: 50
                    });
                    if (context.__lambda) {
                        const result = context.__lambda(
                            entity, indexOrKey, length
                        );
                        if (result === true) {
                            return violations;
                        }
                    }
                } catch (exception) {
                    violations.push({ path, condition, exception });
                }
                violations.push({ path, condition });

                return violations;
            }, new Array<Violation>())
            .concat(this.validateInner(path, entity));
    }

    protected abstract validateInner(path: string, entity: any): Violation[];

    write(writer: Writer) {
        writer.writeMap(writer => {
            writer.addText("Name", this.name);
            this.writeInner(writer);
            if (this.conditions) {
                writer.addList("Conditions", writer => this.conditions
                    .forEach(condition => writer.addText(condition)));
            }
        });
    }

    protected abstract writeInner(writer: WriterMap);
}

/**
 * A boolean template entity.
 */
export class TemplateFieldNull extends TemplateField {
    protected validateInner(path: string, entity: any): Violation[] {
        return entity !== null
            ? [{ path, condition: "(x) => x !== null" }]
            : [];
    }

    protected writeInner(writer: WriterMap) {
        writer.addText("Type", "Null");
    }
}

/**
 * A boolean template entity.
 */
export class TemplateFieldBoolean extends TemplateField {
    protected validateInner(path: string, entity: any): Violation[] {
        return entity !== true && entity !== false
            ? [{ path, condition: "(x) => x !== true && x !== false" }]
            : [];
    }

    protected writeInner(writer: WriterMap) {
        writer.addText("Type", "Boolean");
    }
}

/**
 * A number template entity.
 */
export class TemplateFieldNumber extends TemplateField {
    protected validateInner(path: string, entity: any): Violation[] {
        return typeof entity !== "number"
            ? [{ path, condition: "(x) => typeof x !== 'number'" }]
            : [];
    }

    protected writeInner(writer: WriterMap) {
        writer.addText("Type", "Number");
    }
}

/**
 * A UTF-8 string template entity.
 */
export class TemplateFieldText extends TemplateField {
    protected validateInner(path: string, entity: any): Violation[] {
        return typeof entity !== "string"
            ? [{ path, condition: "(x) => typeof x !== 'string'" }]
            : [];
    }

    protected writeInner(writer: WriterMap) {
        writer.addText("Type", "Text");
    }
}

/**
 * A list template entity.
 */
export class TemplateFieldList extends TemplateField {
    /**
     * Field template used to validate each list items.
     */
    public readonly item?: TemplateField;

    /**
     * Field templates used to validate list items at specific positions.
     */
    public readonly items?: TemplateField[];

    protected validateInner(path: string, entity: any): Violation[] {
        if (!Array.isArray(entity)) {
            return [{ path, condition: "(x) => Array.isArray(x)" }];
        }
        return entity
            .reduce((violations: Violation[], item, index) => {
                if (this.item) {
                    violations.push(...this.item
                        .validate(path, item, index, entity.length));
                }
                if (this.items && this.items[index]) {
                    violations.push(...this.items[index]
                        .validate(path, item, index, entity.length)
                    );
                }
                return violations;
            }, new Array<Violation>());
    }

    protected writeInner(writer: WriterMap) {
        writer.addText("Type", "List");
        if (this.item) {
            writer.addWritable("Item", this.item);
        }
        if (this.items) {
            writer.addList("Items", writer => this.items
                .forEach(item => writer.addWritable(item)));
        }
    }
}

/**
 * A map template entity.
 */
export class TemplateFieldMap extends TemplateField {
    /**
     * Field template used to validate each map value.
     */
    public readonly entry?: TemplateField;

    /**
     * Field templates use to validate map values with specific keys.
     */
    public readonly entries?: Iterable<[string, TemplateField]>;

    protected validateInner(path: string, entity: any): Violation[] {
        if (Array.isArray(entity) || typeof entity !== "object") {
            return [{
                path,
                condition: "(x) => !Array.isArray(x) && typeof x === 'object'"
            }];
        }
        const names = Object.getOwnPropertyNames(entity);
        return names
            .reduce((violations: Violation[], name) => {
                const value = entity[name];
                const itemPath = path + "." + name;
                if (this.entry) {
                    violations.push(...this.entry
                        .validate(path, value, name, names.length));
                }
                if (this.entries && this.entries[name]) {
                    violations.push(...this.entries[name]
                        .validate(path, value, name, names.length)
                    );
                }
                return violations;
            }, new Array<Violation>());
    }

    protected writeInner(writer: WriterMap) {
        writer.addText("Type", "Map");
        if (this.entry) {
            writer.addWritable("Entry", this.entry);
        }
        if (this.entries) {
            writer.addMap("Entries", writer => Object
                .getOwnPropertyNames(this.entries)
                .forEach(key => writer.addWritable(key, this.entries[key])));
        }
    }
}
