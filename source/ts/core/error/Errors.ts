/**
 * Holds multiple `Error`s.
 */
export class Errors extends Error {
    /**
     * Creates new object holding multiple errors.
     * 
     * @param errors Wrapped errors.
     */
    public constructor(
        public readonly errors: any[] = []
    ) {
        super("Errors (" + (errors.map(e => e.message).join(", ")) + ")");
        this.name = (this as any).constructor.name;
    }
}