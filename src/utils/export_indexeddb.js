// exportIndexedDB.js
// Exports all IndexedDB databases (except those listed) and all localStorage data to a JSON string.

/**
 * Export all IndexedDB databases and localStorage data, excluding specified database names.
 * @param {string[]} excludeDbNames - Array of database names to exclude from export.
 * @returns {Promise<string>} JSON string containing exported data.
 */
export async function exportIndexedDB(excludeDbNames = []) {
    if (!window.indexedDB) {
        throw new Error('IndexedDB is not supported in this browser.');
    }
    if (!Array.isArray(excludeDbNames)) {
        throw new Error('excludeDbNames must be an array of database names.');
    }

    // Convert ArrayBuffer to Base64 string for JSON serialization
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Recursively convert binary types (ArrayBuffer) to serializable objects
    function convertBinaryToSerializable(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof ArrayBuffer) {
            return { __type: 'ArrayBuffer', data: arrayBufferToBase64(obj) };
        }
        if (Array.isArray(obj)) {
            return obj.map(item => convertBinaryToSerializable(item));
        }
        const newObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = convertBinaryToSerializable(obj[key]);
            }
        }
        return newObj;
    }

    // Retrieve all IndexedDB database names present in the browser
    async function getAllDatabaseNames() {
        if (!window.indexedDB.databases) {
            throw new Error('indexedDB.databases() is not supported. Cannot enumerate databases.');
        }
        const dbs = await window.indexedDB.databases();
        return dbs.map(db => db.name);
    }

    // Get the current version of a database by name
    async function getDatabaseVersion(name) {
        if (!window.indexedDB.databases) {
            throw new Error('indexedDB.databases() is not supported. Cannot determine version automatically.');
        }
        const dbs = await window.indexedDB.databases();
        const dbInfo = dbs.find(db => db.name === name);
        if (!dbInfo) throw new Error(`Database "${name}" not found.`);
        return dbInfo.version;
    }

    // Export a single database by name
    async function exportSingleDatabase(dbName) {
        try {
            const version = await getDatabaseVersion(dbName);
            return await new Promise((resolve, reject) => {
                const request = indexedDB.open(dbName, version);
                request.onerror = (event) => reject(new Error(`Failed to open database: ${event.target.error.message}`));
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    const storeNames = Array.from(db.objectStoreNames);
                    if (storeNames.length === 0) {
                        db.close();
                        resolve({ databaseName: dbName, stores: {}, message: 'No object stores found' });
                        return;
                    }

                    const exportData = { databaseName: dbName, stores: {} };
                    const promises = storeNames.map(storeName => {
                        return new Promise((resolveStore, rejectStore) => {
                            const transaction = db.transaction(storeName, 'readonly');
                            const store = transaction.objectStore(storeName);
                            const keyPath = store.keyPath;
                            const autoIncrement = store.autoIncrement;
                            const indexNames = Array.from(store.indexNames);
                            const indexes = indexNames.map(idxName => {
                                const idx = store.index(idxName);
                                return {
                                    name: idx.name,
                                    keyPath: idx.keyPath,
                                    unique: idx.unique,
                                    multiEntry: idx.multiEntry
                                };
                            });

                            const records = [];
                            const cursorRequest = store.openCursor();
                            cursorRequest.onerror = (e) => rejectStore(e.target.error);
                            cursorRequest.onsuccess = (e) => {
                                const cursor = e.target.result;
                                if (cursor) {
                                    const convertedKey = convertBinaryToSerializable(cursor.key);
                                    const convertedValue = convertBinaryToSerializable(cursor.value);
                                    records.push({ key: convertedKey, value: convertedValue });
                                    cursor.continue();
                                } else {
                                    exportData.stores[storeName] = {
                                        config: { keyPath, autoIncrement, indexes },
                                        records: records
                                    };
                                    resolveStore();
                                }
                            };
                        });
                    });

                    Promise.all(promises)
                        .then(() => {
                            db.close();
                            resolve(exportData);
                        })
                        .catch(err => {
                            db.close();
                            reject(err);
                        });
                };
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    db.close();
                    reject(new Error('Version mismatch or database does not exist.'));
                };
            });
        } catch (err) {
            return { databaseName: dbName, error: err.message || String(err) };
        }
    }

    // Determine which databases to export by excluding the specified names
    const allDbNames = await getAllDatabaseNames();
    const excludeSet = new Set(excludeDbNames);
    const targetDbNames = allDbNames.filter(name => !excludeSet.has(name));

    // Export all target databases in parallel
    const indexedDBResults = await Promise.all(targetDbNames.map(name => exportSingleDatabase(name)));

    // Collect all localStorage key-value pairs
    const localStorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
            localStorageData[key] = localStorage.getItem(key);
        }
    }

    // Build final export object
    const combined = {
        exportedAt: new Date().toISOString(),
        localStorage: localStorageData,
        databases: indexedDBResults
    };

    return JSON.stringify(combined, null, 2);
}