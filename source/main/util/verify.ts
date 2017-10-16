/**
 * Verifies that given value is an array, undefined or null.
 *
 * @param value Value to verify.
 * @param message Verification failure message.
 */
export function isArrayOrNothing(value: any, message?: string): any[] {
    if (value === undefined || value === null || Array.isArray(value)) {
        return value;
    }
    throw new TypeError("Not array or nothing: " + value);
}

/**
 * Verifies that given value is an object.
 *
 * @param value Value to verify.
 * @param message Verification failure message.
 */
export function isObject(value: any, message?: string): object {
    if (typeof value === "object") {
        return value;
    }
    throw new TypeError(message || "Not an object: " + value);
}

/**
 * Verifies that given value is an object, undefined or null.
 *
 * @param value Value to verify.
 * @param message Verification failure message.
 */
export function isObjectOrNothing(value: any, message?: string): object {
    if (value === undefined || value === null || typeof value === "object") {
        return value;
    }
    throw new TypeError(message || "Not object or nothing: " + value);
}

/**
 * Verifies that given value is a string.
 *
 * @param value Value to verify.
 * @param message Verification failure message.
 */
export function isString(value: any, message?: string): string {
    if (typeof value === "string") {
        return value;
    }
    throw new TypeError(message || "Not a string: " + value);
}