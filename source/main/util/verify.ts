export function isArrayOrNothing(value: any, message?: string): any[] {
    if (value === undefined || value === null || Array.isArray(value)) {
        return value;
    }
    throw new TypeError("Not array or nothing: " + value);
}

export function isObject(value: any, message?: string): object {
    if (typeof value === "object") {
        return value;
    }
    throw new TypeError(message || "Not an object: " + value);
}

export function isObjectOrNothing(value: any, message?: string): object {
    if (value === undefined || value === null || typeof value === "object") {
        return value;
    }
    throw new TypeError(message || "Not object or nothing: " + value);
}

export function isString(value: any, message?: string): string {
    if (typeof value === "string") {
        return value;
    }
    throw new TypeError(message || "Not a string: " + value);
}