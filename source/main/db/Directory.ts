/**
 * A database useful for storing arbitrary data in a manner similar to that of
 * a regular filesystem.
 *
 * # Files and Folders
 *
 * The directory contains two kinds of entires, files and folders. Files have
 * associated data, are created explicitly, and are referred to via fully
 * qualified paths. Folders may contain other folders and files, are created
 * implicitly, and are referred to via partially qualified paths.
 *
 * # Paths
 *
 * Each path is constituted by segments delimited by ASCII dots. The leftmost
 * segment is considered a child of the implicit root folder, and each
 * following segment is considered a child of the preceding. A path is
 * considered partially qualified, i.e. referring to a folder, if it ends with
 * a trailing ASCII dot. In any other case the path is considered fully
 * qualified. All paths should begin with a leading ASCII dot. If the leading
 * dot is missing, it will be treated as though it is present.
 */
export interface Directory {
    /**
     * Adds given array of entries.
     *
     * If an added entry has a path equal to any existing entry, the existing
     * entry is replaced. Providing an entry with a partially qualified path
     * causes an error to be returned and no entries to be added.
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
    list(paths: string[]): Promise<DirectoryEntry[]>;

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

    /**
     * Closes directory, releasing any resources held.
     *
     * Using the directory after closing it causes undefined behavior.
     */
    close();
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