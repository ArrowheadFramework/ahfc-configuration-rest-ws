/**
 * Ensures given path has a leading ASCII dot.
 * 
 * @param path Path to normalize.
 */
export function normalize(path: string): string {
    return (path.startsWith(".") ? "" : ".") + path;
}

/**
 * Joins given two paths together.
 * 
 * @param a Base path.
 * @param b Extension path.
 */
export function join(a: string, b: string): string {
    return a + normalize(b);
}

/**
 * Adds provided prefix to each given path.
 * 
 * @param prefix Path prefix.
 * @param paths Paths to prefix.
 */
export function prefix(prefix: string, ...paths: string[]): string[] {
    return paths.map(path => join(prefix, path));
}