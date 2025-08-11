import { getItems, addItem, updateItem, deleteItem } from '../db.js';
import { TYPE_TEXT, TYPE_NUMBER, TYPE_BOOLEAN, TYPE_LIST } from '../types/index.js';

export async function syncItems(path, parsedObject) {
    const existingItems = await getItems(path);
    const existingItemsMap = new Map(existingItems.map(i => [i.name, i]));
    const parsedKeys = new Set(Object.keys(parsedObject));

    const promises = [];

    // Updates and additions
    for (const name of parsedKeys) {
        const value = parsedObject[name];
        const existingItem = existingItemsMap.get(name);
        const valueType = typeof value;

        let type;
        if (valueType === 'string') type = TYPE_TEXT;
        else if (valueType === 'number') type = TYPE_NUMBER;
        else if (valueType === 'boolean') type = TYPE_BOOLEAN;
        else if (valueType === 'object' && value !== null) type = TYPE_LIST;
        else {
            console.warn(`Unsupported value type for ${name}: ${valueType}`);
            continue;
        }

        if (existingItem) {
            // Item exists, check for updates
            if (existingItem.type === TYPE_LIST && type === TYPE_LIST) {
                // Recurse for lists
                promises.push(syncItems(`${path}${name}/`, value));
            } else if (existingItem.type !== TYPE_LIST && type !== TYPE_LIST && existingItem.value !== value) {
                // Value changed, update it
                const updatedItem = { ...existingItem, value, type };
                promises.push(updateItem(updatedItem));
            } else if (existingItem.type !== type) {
                // Type changed. This is more complex. For now, let's delete and re-add.
                promises.push(deleteItem(existingItem.id).then(() => {
                    const newItem = { path, name, type, value: type === TYPE_LIST ? '' : value };
                    return addItem(newItem);
                }));
            }
        } else {
            // New item
            const newItem = {
                path,
                name,
                type,
                value: type === TYPE_LIST ? '' : value,
            };
            promises.push(addItem(newItem).then((id) => {
                if (type === TYPE_LIST) {
                    return syncItems(`${path}${name}/`, value);
                }
            }));
        }
    }

    // Deletions
    for (const [name, item] of existingItemsMap.entries()) {
        if (!parsedKeys.has(name)) {
            // Before deleting a list, we must delete all its children
            if (item.type === TYPE_LIST) {
                promises.push(deleteListRecursive(`${path}${name}/`).then(() => deleteItem(item.id)));
            } else {
                promises.push(deleteItem(item.id));
            }
        }
    }

    await Promise.all(promises);
}

export async function deleteListRecursive(path) {
    const items = await getItems(path);
    const promises = [];
    for (const item of items) {
        if (item.type === 'list') {
            promises.push(deleteListRecursive(`${path}${item.name}/`));
        }
        promises.push(deleteItem(item.id));
    }
    await Promise.all(promises);
}