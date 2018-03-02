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
export interface Directory<T = DirectoryEntry> {
    /**
     * Enter subdirectory with given name.
     *
     * The directory object returned by this method is limited to reading and
     * writing to the named directory.
     *
     * @param directory Name of directory to enter. If multiple directories
     * need to be entered, they may be separated by ASCII dots.
     * @return Subdirectory object.
     */
    enter(directory: string): Directory<T>;

    /**
     * Transforms read and written entries using given transformation functions.
     * 
     * @param reader Reads entries.
     * @param writer Writes entries.
     */
    map<U>(reader: (t: T) => U, writer: (u: U) => T): Directory<U>;

    /**
     * Executes given function in read-only database transaction.
     *
     * The provided transaction function is expected to return a promise. When
     * the promise is fulfilled or rejected, the transaction is released. Using
     * the transaction reader after a transaction has been released causes
     * undefined behavior.
     *
     * @param fn Transaction function.
     * @return Whatever was returned by the transaction function.
     */
    read<U>(fn: (reader: DirectoryReader<T>) => Promise<U>): Promise<U>;

    /**
     * Executes given function in read/write database transaction.
     *
     * The provided transaction function is expected to return a promise. When
     * the promise is fulfilled or rejected, the transaction is commited or
     * aborted, respectively. Using a transaction writer after a transaction
     * has been released causes undefined behavior.
     *
     * @param fn Transaction function.
     * @return Whatever was returned by the transaction function.
     */
    write<U>(fn: (writer: DirectoryWriter<T>) => Promise<U>): Promise<U>;

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

/**
 * A directory reader provided to read-only transactions.
 */
export interface DirectoryReader<T = DirectoryEntry> {
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
    list(paths: Iterable<string>): Promise<T[]>;
}

/**
 * A directory writer provided to read/write transactions.
 */
export interface DirectoryWriter<T = DirectoryEntry> extends DirectoryReader<T> {
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
    add(entries: Iterable<T>): Promise<void>;

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
    remove(paths: Iterable<string>): Promise<void>;
}

/**
 * A special directory, wrapping another directory and transforming the items
 * it reads and writes.
 */
export class DirectoryTransformer<T, U> implements Directory<U> {
    /**
     * Creates new directory transformer.
     * 
     * @param directory Wrapped directory.
     * @param reader Transforms read values from wrapped directory.
     * @param writer Transforms values to be written to wrapped directory.
     */
    public constructor(
        private readonly directory: Directory<T>,
        private readonly reader: (t: T) => U, 
        private readonly writer: (u: U) => T,
    ) {}

    enter(directory: string): Directory<U> {
        return new DirectoryTransformer(
            this.directory.enter(directory),
            this.reader, this.writer);
    }

    map<V>(reader: (u: U) => V, writer: (v: V) => U): Directory<V> {
        return new DirectoryTransformer(this, reader, writer);
    }

    read<V>(fn: (reader: DirectoryReader<U>) => Promise<V>): Promise<V> {
        return this.directory.read(reader => {
            const self = this;
            return fn(new class implements DirectoryReader<U> {
                list(paths: Iterable<string>): Promise<U[]> {
                    return reader
                        .list(paths)
                        .then(items => {
                            return items.map(self.reader)
                        });
                }
            });
        });
    }

    write<V>(fn: (writer: DirectoryWriter<U>) => Promise<V>): Promise<V> {
        return this.directory.write(writer => {
            const self = this;
            return fn(new class implements DirectoryWriter<U> {
                add(entries: Iterable<U>): Promise<void> {
                    return writer.add(Array.from(entries).map(self.writer));
                }

                remove(paths: Iterable<string>): Promise<void> {
                    return writer.remove(paths);
                }

                list(paths: Iterable<string>): Promise<U[]> {
                    return writer
                        .list(paths)
                        .then(items => items.map(self.reader));
                }
            });
        });
    }

    close() {
        this.directory.close();
    }
}