import {
    Directory,
    DirectoryEntry,
    DirectoryReader,
    DirectoryWriter,
    DirectoryTransformer
} from "./Directory";
import * as dpath from "../util/dpath";
import * as fs from "fs";
import * as lmdb from "node-lmdb";

/**
 * A directory implementation relying on LMDB.
 */
export class DirectoryLMDB implements Directory {
    /**
     * Opens LMDB directory database, creating it if necessary.
     *
     * @param path Path to folder where database will or does reside. If the
     * folder does not exist, an attempt will be made to create it. The attempt
     * will only succeed, however, if all parent folders in its path already
     * exist.
     * @param mapSize Size of database memory mapping. Dictates upper limit on
     * database size.
     * @return Opened database.
     */
    public static open(path: string, mapSize = 2147483648): DirectoryLMDB {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
        const env = new lmdb.Env;
        env.open({ path, mapSize, maxDbs: 1 });
        const dbi = env.openDbi({ create: true, name: null });
        return new DirectoryLMDB("", env, dbi);
    }

    private constructor(
        private readonly dir: string,
        private readonly env: lmdb.Env,
        private readonly dbi: any,
    ) { }

    public enter(directory: string): Directory {
        const dir = dpath.join(this.dir, directory); 
        return new DirectoryLMDB(dir, this.env, this.dbi);
    }

    map<U>(reader: (t: DirectoryEntry) => U, writer: (u: U) => DirectoryEntry): Directory<U> {
        return new DirectoryTransformer(this, reader, writer);
    }

    public read<T>(f: (r: DirectoryReader) => Promise<T>): Promise<T> {
        let txn: lmdb.Txn;
        try {
            txn = this.env.beginTxn({ readOnly: true });
            return f(new DirectoryReaderLMDB(this.dir, this.env, this.dbi, txn))
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
            return f(new DirectoryWriterLMDB(this.dir, this.env, this.dbi, txn))
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
        if (this.dir === "") {
            this.dbi.close();
            this.env.close();
        }
    }
}

class DirectoryReaderLMDB implements DirectoryReader {
    public constructor(
        protected readonly dir: string,
        protected readonly env: lmdb.Env,
        protected readonly dbi: lmdb.Dbi,
        protected readonly txn: lmdb.Txn,
    ) { }

    public list(paths: Iterable<string>): Promise<DirectoryEntry[]> {
        return new Promise((resolve, reject) => {
            try {
                const result = new Array<DirectoryEntry>();
                const cursor = new lmdb.Cursor(this.txn, this.dbi);
                const paths0 = dpath.prefix(this.dir, ...paths);
                visitEachMatch(paths0, cursor, () => {
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
    public constructor(dir: string, env: lmdb.Env, dbi: any, txn: lmdb.Txn) {
        super(dir, env, dbi, txn);
    }

    public add(entries: Iterable<DirectoryEntry>): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                for (const entry of entries) {
                    if (entry.path.endsWith(".")) {
                        throw new Error(
                            "Path not fully qualified: '" + entry.path + "'"
                        );
                    }
                    const p = dpath.join(this.dir, entry.path);
                    this.txn.putBinary(this.dbi, p, entry.value);
                }
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    public remove(paths: Iterable<string>): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const cursor = new lmdb.Cursor(this.txn, this.dbi);
                const paths0 = dpath.prefix(this.dir, ...paths);
                visitEachMatch(paths0, cursor, () => cursor.del());
                cursor.close();
                resolve();
            } catch (error) {
                reject(error);
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
    if (!paths || paths.length === 0) {
        return;
    }
    filterOverlappingPaths(paths).forEach(path => {
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
