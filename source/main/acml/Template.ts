import { Writable, Writer, WriterMap } from "../apes";
import { Document } from "./Document";
import { Report, Violation } from "./Report";
import * as verify from "../util/verify";
import * as vm from "vm";

/**
 * A configuration template.
 *
 * Configuration templates are descriptions of what may and may not be part of
 * a configuration document.
 */
export class Template implements Writable {
    public readonly isWritable = true;
    
    /**
     * Creates new template with given name and specification.
     *
     * @param name Name of template.
     * @param body Template specification.
     */
    public constructor(
        public readonly name: string,
        public readonly body: TemplateBody,
    ) {
        if (name.endsWith(".")) {
            throw new Error(
                "Template name not fully qualified: " + name
            );
        }
    }

    /**
     * Attempts to create new template from given source object.
     *
     * @param source Object to build template from.
     * @return New template.
     */
    public static read(source: object): Template {
        return new Template(
            verify.isString(source["TemplateName"]),
            TemplateField.read(verify.isObject(source["Body"]))
        );
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

    public write(writer: Writer) {
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
    public readonly isWritable = true;

    /**
     * @param name Human and machine readable field identifier.
     * @param conditions Conditions that must be satisfied for a document
     * instance of this field to be considered sound.
     */
    protected constructor(
        public readonly name: string,
        public readonly conditions?: TemplateCondition[],
    ) { }

    /**
     * Attempts to create new template field from given source object.
     *
     * @param source Object to build field from.
     * @return New field.
     */
    public static read(source: object): TemplateField {
        if (!source) {
            return undefined;
        }
        verify.isObject(source);
        let decoder;
        switch (verify.isString(source["Type"])) {
            case "Null":
                decoder = TemplateFieldNull.read;
                break;

            case "Boolean":
                decoder = TemplateFieldBoolean.read;
                break;

            case "Number":
                decoder = TemplateFieldNumber.read;
                break;

            case "Text":
                decoder = TemplateFieldText.read;
                break;

            case "List":
                decoder = TemplateFieldList.read;
                break;

            case "Map":
                decoder = TemplateFieldMap.read;
                break;

            default:
                throw new TypeError("Bad template: " + JSON.stringify(source));
        }
        return decoder(source);
    }

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

    public write(writer: Writer) {
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
    /**
     * Creates new Null template field.
     *
     * @param name Field identifier.
     * @param conditions Field conditions.
     */
    public constructor(name: string, conditions?: TemplateCondition[]) {
        super(name, conditions);
    }

    /**
     * Attempts to create new Null template field from given source object.
     *
     * @param source Object to build field from.
     * @return New field.
     */
    public static read(source: object): TemplateFieldNull {
        return new TemplateFieldNull(
            verify.isString(source["Name"]),
            verify.isArrayOrNothing(source["Conditions"])
        );
    }

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
    /**
     * Creates new Boolean template field.
     *
     * @param name Field identifier.
     * @param conditions Field conditions.
     */
    public constructor(name: string, conditions?: TemplateCondition[]) {
        super(name, conditions);
    }

    /**
     * Attempts to create new Boolean template field from given source object.
     *
     * @param source Object to build field from.
     * @return New field.
     */
    public static read(source: object): TemplateFieldBoolean {
        return new TemplateFieldBoolean(
            verify.isString(source["Name"]),
            verify.isArrayOrNothing(source["Conditions"])
        );
    }

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
    /**
     * Creates new Number template field.
     *
     * @param name Field identifier.
     * @param conditions Field conditions.
     */
    public constructor(name: string, conditions?: TemplateCondition[]) {
        super(name, conditions);
    }

    /**
     * Attempts to create new Number template field from given source object.
     *
     * @param source Object to build field from.
     * @return New field.
     */
    public static read(source: object): TemplateFieldNumber {
        return new TemplateFieldNumber(
            verify.isString(source["Name"]),
            verify.isArrayOrNothing(source["Conditions"])
        );
    }

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
    /**
     * Creates new Text template field.
     *
     * @param name Field identifier.
     * @param conditions Field conditions.
     */
    public constructor(name: string, conditions?: TemplateCondition[]) {
        super(name, conditions);
    }

    /**
     * Attempts to create new Text template field from given source object.
     *
     * @param source Object to build field from.
     * @return New field.
     */
    public static read(source: object): TemplateFieldText {
        return new TemplateFieldText(
            verify.isString(source["Name"]),
            verify.isArrayOrNothing(source["Conditions"])
        );
    }

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
     * Creates new List template field.
     *
     * @param name Field identifier.
     * @param conditions Field conditions.
     * @param item Field template used to validate each list items.
     * @param items Field templates used to validate list items at specific
     * positions.
     */
    public constructor(
        name: string,
        conditions?: TemplateCondition[],
        public readonly item?: TemplateField,
        public readonly items?: TemplateField[],
    ) {
        super(name, conditions);
    }

    /**
     * Attempts to create new List template field from given source object.
     *
     * @param source Object to build field from.
     * @return New field.
     */
    public static read(source: object): TemplateFieldList {
        return new TemplateFieldList(
            verify.isString(source["Name"]),
            verify.isArrayOrNothing(source["Conditions"]),
            TemplateField.read(source["Item"]),
            (verify.isArrayOrNothing(source["Items"]) || [])
                .map(item => TemplateField.read(item)),
        );
    }

    protected validateInner(path: string, entity: any): Violation[] {
        if (!Array.isArray(entity)) {
            return [{ path, condition: "(x) => Array.isArray(x)" }];
        }
        return entity
            .reduce((violations: Violation[], item, index) => {
                const itemPath = path + "[" + index + "]";
                if (this.item) {
                    violations.push(...this.item
                        .validate(itemPath, item, index, entity.length));
                }
                if (this.items && this.items[index]) {
                    violations.push(...this.items[index]
                        .validate(itemPath, item, index, entity.length)
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
     * Creates new Map template field.
     *
     * @param name Field identifier.
     * @param conditions Field conditions.
     * @param entry Field template used to validate each map value.
     * @param entries Field templates use to validate map values with specific
     * keys.
     */
    public constructor(
        name: string,
        conditions?: TemplateCondition[],
        public readonly entry?: TemplateField,
        public readonly entries?: { [key: string]: TemplateField },
    ) {
        super(name, conditions);
    }

    /**
     * Attempts to create new Map template field from given source object.
     *
     * @param source Object to build field from.
     * @return New field.
     */
    public static read(source: object): TemplateFieldMap {
        const entries = source["Entries"] || {};
        return new TemplateFieldMap(
            verify.isString(source["Name"]),
            verify.isArrayOrNothing(source["Conditions"]),
            TemplateField.read(source["Entry"]),
            Object.getOwnPropertyNames(verify
                .isNonArrayObjectOrNothing(entries) || {})
                .reduce((result, key) => {
                    result[key] = TemplateField.read(entries[key]);
                    return result;
                }, {}));
    }

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
                const entryPath = path + "." + name;
                if (this.entry) {
                    violations.push(...this.entry
                        .validate(entryPath, value, name, names.length));
                }
                if (this.entries && this.entries[name]) {
                    violations.push(...this.entries[name]
                        .validate(entryPath, value, name, names.length)
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
