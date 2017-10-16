/**
 * A database useful for storing arbitrary data in a manner similar to that of
 * a regular filesystem.
 *
 * Each data entry has an associated path, which identifies any folders the
 * entry is part of, as well as its name. Path segments are delimited by ASCII
 * dot. The leftmost segment of a path identifies a folder or entry in the
 * implicit root folder.
 */
export interface Directory {
    /**
     * Adds given array of entries.
     *
     * If an added entry has a path equal to any existing entry, the existing
     * entry is replaced.
     *
     * @param entries Entries to add.
     * @return A promise resolved with nothing when the operation is completed.
     */
    add(entries: DirectoryEntry[]): Promise<void>;

    /**
     * Retrieves all stored entries with paths matching those given.
     *
     * The provided paths may be fully or partially qualified. In case of any
     * partially qualified path, all entries that begins with the same path
     * segments are considered matches. Note that a single empty path, or a
     * array of zero paths, will match everything.
     *
     * @param paths An array of fully or partially qualified entry paths.
     * @return A list of entries.
     */
    list(paths: string[]): Promise<DirectoryEntry>;

    /**
     * Removes all stored entries with paths matching those given.
     *
     * The provided paths may be fully or partially qualified. In case of any
     * partially qualified path, all entries that begins with the same path
     * segments are considered matches. Note that a single empty path, or a
     * array of zero paths, will match everything.
     *
     * @param paths An array of fully or partially qualified template paths.
     * @return A promise resolved with nothing when the operation is completed.
     */
    remove(paths: string[]): Promise<void>;
}

/**
 * An entry of a directory.
 */
export interface DirectoryEntry {
    /** Entry path. */
    path: string;

    /** Entry value. */
    value: Buffer;
}