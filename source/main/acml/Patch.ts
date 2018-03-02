import * as apes from "../apes";
import { Document } from "./Document";
import { Report, Violation } from "./Report";
import * as verify from "../util/verify";

/**
 * A configuration document patch.
 */
export class Patch implements apes.Writable {
    private static REGEX_IS_PATH = /((\w(\d|\w)*\/)|(\d+\/))*?((\w(\d|\w)*)|(\d+))?/;
    private static REGEX_IS_INT = /[0-9]+/;
    public readonly isWritable = true;

    /**
     * Creates new configuration document patch.
     * 
     * @param name Name of document.
     * @param path Path identifying part of document to patch.
     * @param data Data to insert at document location identified by patch.
     */
    public constructor(
        public readonly name: string,
        public readonly path: string,
        public readonly data?: any,
    ) {
        if (!name) {
            throw new Error("Document name must be specified.");
        }
        if (name.endsWith(".")) {
            throw new Error(
                "Document name not fully qualified: " + name
            );
        }
        if (!Patch.REGEX_IS_PATH.test(path)) {
            throw new Error(
                "Illegal document patch path: " + path
            );
        }
    }

    /**
     * Creates new patch report containing given violations.
     * 
     * @param violations Violations to put in patch report.
     */
    public report(...violations: Violation[]): Report {
        return new Report(this.name, undefined, violations);
    }

    /**
     * Applies this patch to given object.
     *
     * An error is thrown if the document name in the patch doesn't match the
     * name of the given document.
     *
     * __Note that the given document body is mutated by this method.__
     * 
     * @param document Document to patch.
     * @returns Modified document.
     */
    public apply(document: Document) {
        if (document.name !== this.name) {
            throw new Error(
                `Cannot apply ${this.name}'s patch to document ${document.name}`
            );
        }
        mutate(this.path, document.body, this.data);

        function mutate(path, object, data) {
            if (!path) {
                return data;
            }
            let i = path.indexOf("/");
            const [head, tail] = i >= 0
                ? [path.slice(0, i), path.slice(i+1)]
                : [path, undefined];
            let index;
            if (Patch.REGEX_IS_INT.test(head)) {
                index = parseInt(head);
                if (!Array.isArray(object)) {
                    object = [];
                }
            } else {
                index = head;
                if (typeof object !== "object" || Array.isArray(object)) {
                    object = {};
                }
            }
            object[index] = mutate(tail, object[index], data);
            return object;            
        }
    }

    /**
     * Attempts to create new document from given source object.
     *
     * @param source Object to build document from.
     * @return New document.
     */
    public static read(source: object): Patch {
        return new Patch(
            verify.isString(source["DocumentName"]),
            verify.isString(source["Path"]),
            source["Patch"]
        );
    }

    public write(writer: apes.Writer) {
        writer.writeMap(writer => writer
            .add("DocumentName", this.name)
            .addText("Path", this.path)
            .add("Patch", this.data));
    }
}