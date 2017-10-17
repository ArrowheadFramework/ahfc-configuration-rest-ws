import { Directory, DirectoryEntry } from "./Directory";
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

    public add(entries: DirectoryEntry[]): Promise<void> {
        return new Promise((resolve, reject) => {
            let txn: lmdb.Txn;
            try {
                txn = this.env.beginTxn();
                for (const entry of entries) {
                    if (entry.path.endsWith(".")) {
                        throw new Error(
                            "Path not fully qualified: '" + entry.path + "'"
                        );
                    }
                    txn.putBinary(this.dbi, entry.path, entry.value);
                }
                txn.commit();
                resolve();
            } catch (exception) {
                reject(exception);
                if (txn) {
                    txn.abort();
                }
            }
        });
    }

    public list(paths: string[]): Promise<DirectoryEntry[]> {
        return new Promise((resolve, reject) => {
            let txn: lmdb.Txn;
            try {
                txn = this.env.beginTxn({ readOnly: true });
                const result = new Array<DirectoryEntry>();
                const cursor = new lmdb.Cursor(txn, this.dbi);
                visitEachMatch(paths, cursor, () => {
                    cursor.getCurrentBinary((path, value) => {
                        result.push({ path, value });
                    });
                });
                cursor.close();
                resolve(result);
            } catch (exception) {
                reject(exception);
            } finally {
                if (txn) {
                    txn.abort();
                }
            }
        });
    }

    public remove(paths: string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            let txn: lmdb.Txn;
            try {
                txn = this.env.beginTxn({ readOnly: false });
                const cursor = new lmdb.Cursor(txn, this.dbi);
                visitEachMatch(paths, cursor, () => {
                    cursor.del();
                });
                cursor.close();
                txn.commit();
                resolve();
            } catch (exception) {
                reject(exception);
                if (txn) {
                    txn.abort();
                }
            }
        });
    }

    public close() {
        this.dbi.close();
        this.env.close();
    }
}

function visitEachMatch(paths: string[], cursor: lmdb.Cursor, f: () => void) {
    ((paths && paths.length > 0) ? paths : [""])
        .forEach(path => {
            let key: string = cursor.goToRange(path);
            if (path.endsWith(".")) {
                while (key.startsWith(path)) {
                    f();
                    key = cursor.goToNext();
                }
            } else if (key === path) {
                f();
            }
        });
}
