const DB_NAME = 'itemDB';
const DB_VERSION = 1;
const STORE_NAME = 'items';

let db;

/**
 * Initializes the IndexedDB database.
 * This function should be called once when the application starts.
 */
export function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('path', 'path', { unique: false });
                store.createIndex('order', 'order', { unique: false });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database initialized successfully');
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Adds a new item to the database.
 * @param {object} item - The item to add. It should have `path`, `name`, `type`, and `value`.
 * @returns {Promise<IDBValidKey>} The ID of the newly added item.
 */
export function addItem(item) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject('Database not initialized.');

        try {
            const itemsInPath = await getItems(item.path);
            const existingNames = new Set(itemsInPath.map(i => i.name));

            let finalName = item.name;

            if (existingNames.has(finalName)) {
                const match = finalName.match(/^(.*)_(\d+)$/);
                let baseName = finalName;
                let counter = 1;

                if (match) {
                    baseName = match[1];
                    counter = parseInt(match[2], 10);
                }

                do {
                    finalName = `${baseName}_${counter}`;
                    counter++;
                } while (existingNames.has(finalName));
            }

            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const newItem = {
                ...item,
                name: finalName,
                id: crypto.randomUUID(),
                createdAt: new Date(),
                order: itemsInPath.length
            };

            const request = store.add(newItem);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Retrieves all items for a given path, sorted by the 'order' property.
 * @param {string} path - The path to fetch items from.
 * @returns {Promise<Array<object>>} A list of items.
 */
export function getItems(path) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('Database not initialized.');

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('path');
        const request = index.getAll(path);

        request.onsuccess = () => {
            resolve(request.result.sort((a, b) => a.order - b.order));
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Retrieves a single item by its ID.
 * @param {string} id - The ID of the item to fetch.
 * @returns {Promise<object>} The item object.
 */
export function getItem(id) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('Database not initialized.');

        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Updates an existing item in the database.
 * @param {object} item - The item object with updated values.
 * @returns {Promise<IDBValidKey>} The ID of the updated item.
 */
export function updateItem(item) {
    return new Promise(async (resolve, reject) => {
        if (!db) return reject('Database not initialized.');

        try {
            const itemsInPath = await getItems(item.path);
            if (itemsInPath.some(i => i.name === item.name && i.id !== item.id)) {
                return reject(new Error(`O item "${item.name}" já existe neste local.`));
            }

            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Deletes an item from the database by its ID.
 * @param {string} id - The ID of the item to delete.
 * @returns {Promise<void>}
 */
export function deleteItem(id) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('Database not initialized.');

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

/**
 * Updates the order of multiple items in a single transaction.
 * @param {Array<object>} items - An array of item objects with their 'id' and new 'order'.
 * @returns {Promise<void>}
 */
export function updateItemsOrder(items) {
    return new Promise((resolve, reject) => {
        if (!db) return reject('Database not initialized.');
        if (!items || items.length === 0) return resolve();

        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        transaction.oncomplete = () => {
            resolve();
        };
        transaction.onerror = (event) => {
            reject(event.target.error);
        };
        transaction.onabort = () => {
            reject(new Error('Transaction was aborted.'));
        };

        items.forEach(itemToUpdate => {
            const request = store.get(itemToUpdate.id);
            request.onsuccess = () => {
                const item = request.result;
                if (item) {
                    item.order = itemToUpdate.order;
                    store.put(item);
                }
            };
        });
    });
}
