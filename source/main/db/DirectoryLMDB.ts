import {
    Directory,
    DirectoryEntry,
    DirectoryReader,
    DirectoryWriter
} from "./Directory";
import * as fs from "fs";
import * as lmdb from "node-lmdb";

/**
 * A directory implementation relying on LMDB.
 */
export class DirectoryLMDB implements Directory {
    private readonly env: lmdb.Env;
    private readonly dbi: any;

    /**
     * Creates new LMDB directory database.
     *
     * @param path Path to folder where database will or does reside. If the
     * folder does not exist, an attempt will be made to create it. The attempt
     * will only succeed, however, if all parent folders in its path already
     * exist.
     * @param mapSize Size of database memory mapping. Dictates upper limit on
     * database size.
     */
    public constructor(path: string, mapSize = 2 * 1024 * 1024 * 1024) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        this.env = new lmdb.Env;
        this.env.open({ path, mapSize, maxDbs: 1 });
        this.dbi = this.env.openDbi({ create: true, name: null });
    }

    public read<T>(f: (r: DirectoryReader) => Promise<T>): Promise<T> {
        let txn: lmdb.Txn;
        try {
            txn = this.env.beginTxn({ readOnly: true });
            return f(new DirectoryReaderLMDB(this.env, this.dbi, txn))
                .then(result => {
                    txn.abort();
                    return result;
                })
                .catch(error => {
                    txn.abort();
                    return Promise.reject(error);
                });
        } catch (error) {
            if (txn) {
                txn.abort();
            }
            return Promise.reject(error);
        }
    }

    public write<T>(f: (w: DirectoryWriter) => Promise<T>): Promise<T> {
        let txn: lmdb.Txn;
        try {
            txn = this.env.beginTxn({ readOnly: false });
            return f(new DirectoryWriterLMDB(this.env, this.dbi, txn))
                .then(result => {
                    txn.commit();
                    return result;
                })
                .catch(error => {
                    txn.abort();
                    return Promise.reject(error);
                });
        } catch (error) {
            if (txn) {
                txn.abort();
            }
            return Promise.reject(error);
        }
    }

    public close() {
        this.dbi.close();
        this.env.close();
    }
}

class DirectoryReaderLMDB implements DirectoryReader {
    public constructor(
        protected readonly env: lmdb.Env,
        protected readonly dbi: lmdb.Dbi,
        protected readonly txn: lmdb.Txn,
    ) { }

    public list(paths: string[]): Promise<DirectoryEntry[]> {
        return new Promise((resolve, reject) => {
            try {
                const result = new Array<DirectoryEntry>();
                const cursor = new lmdb.Cursor(this.txn, this.dbi);
                visitEachMatch(paths, cursor, () => {
                    cursor.getCurrentBinary((path, value) => {
                        result.push({ path, value });
                    });
                });
                cursor.close();
                resolve(result);
            } catch (exception) {
                reject(exception);
            }
        });
    }
}

class DirectoryWriterLMDB extends DirectoryReaderLMDB implements DirectoryWriter {
    public constructor(env: lmdb.Env, dbi: any, txn: lmdb.Txn) {
        super(env, dbi, txn);
    }

    public add(entries: DirectoryEntry[]): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                for (const entry of entries) {
                    if (entry.path.endsWith(".")) {
                        throw new Error(
                            "Path not fully qualified: '" + entry.path + "'"
                        );
                    }
                    if (!entry.path.startsWith(".")) {
                        entry.path = "." + entry.path;
                    }
                    this.txn.putBinary(this.dbi, entry.path, entry.value);
                }
                resolve();
            } catch (exception) {
                reject(exception);
            }
        });
    }

    public remove(paths: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const cursor = new lmdb.Cursor(this.txn, this.dbi);
                visitEachMatch(paths, cursor, () => {
                    cursor.del();
                });
                cursor.close();
                resolve();
            } catch (exception) {
                reject(exception);
            }
        });
    }
}

function filterOverlappingPaths(paths: string[]) {
    paths = paths.sort();
    const result = [];
    for (let i = 0; i < paths.length; ++i) {
        if (paths[i].endsWith(".")) {
            const prefix = paths[i++];
            result.push(prefix);
            while (paths[i] && paths[i].startsWith(prefix)) {
                ++i;
            }
        } else {
            result.push(paths[i]);
        }
    }
    return result;
}

function visitEachMatch(paths: string[], cursor: lmdb.Cursor, f: () => void) {
    paths = (paths && paths.length > 0) ? filterOverlappingPaths(paths) : ["."];
    paths.forEach(path => {
        if (!path.startsWith(".")) {
            path = "." + path;
        }
        let key: string = cursor.goToRange(path);
        if (path.endsWith(".")) {
            while (key && key.startsWith(path)) {
                f();
                key = cursor.goToNext();
            }
        } else if (key === path) {
            f();
        }
    });
}
