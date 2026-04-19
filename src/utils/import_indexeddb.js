// importIndexedDB.js
// Restores IndexedDB databases (with structure) and localStorage from a JSON file created by exportIndexedDB.

/**
 * Import IndexedDB databases and localStorage data from exported JSON.
 * @param {object|string} jsonData - Exported JSON object or string.
 * @param {boolean} [replace=false] - If true, replace existing databases; if false, skip import for existing ones.
 * @returns {Promise<object>} Result summary for localStorage and each database.
 */
export async function importIndexedDB(jsonData, replace = false) {
    if (!window.indexedDB) {
        throw new Error('IndexedDB is not supported in this browser.');
    }

    let data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid jsonData: must be an object or a valid JSON string');
    }

    // Restore localStorage
    const localStorageResults = { status: 'skipped' };
    if (data.localStorage && typeof data.localStorage === 'object') {
        try {
            localStorage.clear();
            for (const [key, value] of Object.entries(data.localStorage)) {
                localStorage.setItem(key, value);
            }
            localStorageResults.status = 'restored';
            localStorageResults.count = Object.keys(data.localStorage).length;
        } catch (err) {
            localStorageResults.status = 'failed';
            localStorageResults.error = err.message || String(err);
        }
    } else {
        localStorageResults.status = 'skipped';
        localStorageResults.reason = 'No localStorage data found in backup';
    }

    const databasesArray = data.databases;
    if (!Array.isArray(databasesArray)) {
        throw new Error('Invalid format: missing "databases" array in the JSON');
    }

    // Convert Base64 string back to ArrayBuffer
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const buffer = new ArrayBuffer(binary.length);
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return buffer;
    }

    // Recursively restore binary data from serialized format
    function restoreBinary(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj.__type === 'ArrayBuffer' && typeof obj.data === 'string') {
            return base64ToArrayBuffer(obj.data);
        }
        if (Array.isArray(obj)) {
            return obj.map(item => restoreBinary(item));
        }
        const newObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObj[key] = restoreBinary(obj[key]);
            }
        }
        return newObj;
    }

    // Delete a database by name
    async function deleteDatabase(dbName) {
        return new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            deleteRequest.onerror = (event) => reject(new Error(`Failed to delete database: ${event.target.error.message}`));
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onblocked = () => reject(new Error('Database deletion blocked (e.g., other tabs open). Please close them and try again.'));
        });
    }

    // Check if a database exists by attempting to open it (or use indexedDB.databases if available)
    async function databaseExists(dbName) {
        if (window.indexedDB.databases) {
            try {
                const dbs = await window.indexedDB.databases();
                return dbs.some(db => db.name === dbName);
            } catch {
                // Fallback to open attempt if databases() fails
            }
        }
        // Fallback: try opening the database
        return new Promise((resolve) => {
            const request = indexedDB.open(dbName);
            let existed = false;
            request.onsuccess = (e) => {
                existed = true;
                e.target.result.close();
                resolve(true);
            };
            request.onerror = () => resolve(false);
            request.onupgradeneeded = () => {
                existed = false; // Doesn't exist yet, but we're creating it
                // We must abort the version change because we only want to check existence
                request.transaction.abort();
            };
            // Handle the case where onupgradeneeded is triggered
            request.onblocked = () => resolve(true); // Blocked implies existence
        });
    }

    // Import a single database entry
    async function importSingleDatabase(dbEntry) {
        const dbName = dbEntry.databaseName;
        if (dbEntry.error) {
            return { databaseName: dbName, status: 'skipped', reason: `Export had error: ${dbEntry.error}` };
        }
        const storesData = dbEntry.stores || {};
        const storeNames = Object.keys(storesData);
        if (storeNames.length === 0) {
            return { databaseName: dbName, status: 'skipped', reason: 'No object stores in export data' };
        }

        try {
            const exists = await databaseExists(dbName);
            if (exists && !replace) {
                return { databaseName: dbName, status: 'skipped', reason: 'Database already exists and replace is false' };
            }
            if (exists && replace) {
                await deleteDatabase(dbName);
            }

            return new Promise((resolve, reject) => {
                const openRequest = indexedDB.open(dbName, 1);
                openRequest.onerror = (event) => reject(new Error(`Failed to open database: ${event.target.error.message}`));

                openRequest.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    for (const storeName of storeNames) {
                        const storeInfo = storesData[storeName];
                        if (!db.objectStoreNames.contains(storeName)) {
                            const config = storeInfo.config || {};
                            const keyPath = config.keyPath !== undefined ? config.keyPath : null;
                            const autoIncrement = config.autoIncrement || false;
                            let store;
                            if (keyPath !== null && keyPath !== undefined) {
                                store = db.createObjectStore(storeName, { keyPath, autoIncrement });
                            } else {
                                store = db.createObjectStore(storeName, { autoIncrement });
                            }
                            const indexes = config.indexes || [];
                            for (const idx of indexes) {
                                store.createIndex(idx.name, idx.keyPath, {
                                    unique: idx.unique,
                                    multiEntry: idx.multiEntry
                                });
                            }
                        }
                    }
                };

                openRequest.onsuccess = (event) => {
                    const db = event.target.result;
                    const transaction = db.transaction(storeNames, 'readwrite');
                    const promises = [];

                    for (const storeName of storeNames) {
                        const store = transaction.objectStore(storeName);
                        const storeInfo = storesData[storeName];
                        const records = storeInfo.records || [];
                        const config = storeInfo.config || {};
                        const hasKeyPath = (config.keyPath !== undefined && config.keyPath !== null);
                        for (const record of records) {
                            const restoredKey = restoreBinary(record.key);
                            const restoredValue = restoreBinary(record.value);
                            let addPromise;
                            if (hasKeyPath) {
                                addPromise = new Promise((resolvePut, rejectPut) => {
                                    const req = store.add(restoredValue);
                                    req.onerror = (e) => rejectPut(e.target.error);
                                    req.onsuccess = () => resolvePut();
                                });
                            } else {
                                addPromise = new Promise((resolvePut, rejectPut) => {
                                    const req = store.add(restoredValue, restoredKey);
                                    req.onerror = (e) => rejectPut(e.target.error);
                                    req.onsuccess = () => resolvePut();
                                });
                            }
                            promises.push(addPromise);
                        }
                    }

                    transaction.oncomplete = () => {
                        db.close();
                        resolve({ databaseName: dbName, status: 'imported', storeCount: storeNames.length });
                    };
                    transaction.onerror = (event) => {
                        db.close();
                        reject(new Error(`Transaction failed: ${event.target.error.message}`));
                    };
                    transaction.onabort = (event) => {
                        db.close();
                        reject(new Error(`Transaction aborted: ${event.target.error?.message || 'unknown reason'}`));
                    };

                    Promise.all(promises).catch(err => {
                        transaction.abort();
                        db.close();
                        reject(err);
                    });
                };
            });
        } catch (err) {
            return { databaseName: dbName, status: 'failed', reason: err.message || String(err) };
        }
    }

    const indexedDBResults = [];
    for (const dbEntry of databasesArray) {
        const result = await importSingleDatabase(dbEntry);
        indexedDBResults.push(result);
    }

    return {
        localStorage: localStorageResults,
        indexedDB: indexedDBResults
    };
}