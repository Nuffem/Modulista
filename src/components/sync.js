import { getItems, addItem, updateItem, deleteItem } from '../db.js';
import { itemTypes } from '../types.js';

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
        if (valueType === 'string') type = itemTypes.TEXT.type;
        else if (valueType === 'number') type = itemTypes.NUMBER.type;
        else if (valueType === 'boolean') type = itemTypes.BOOLEAN.type;
        else if (valueType === 'object' && value !== null) type = itemTypes.LIST.type;
        else {
            console.warn(`Unsupported value type for ${name}: ${valueType}`);
            continue;
        }

        if (existingItem) {
            // Item exists, check for updates
            if (existingItem.type === itemTypes.LIST.type && type === itemTypes.LIST.type) {
                // Recurse for lists
                promises.push(syncItems(`${path}${name}/`, value));
            } else if (existingItem.type !== itemTypes.LIST.type && type !== itemTypes.LIST.type && existingItem.value !== value) {
                // Value changed, update it
                const updatedItem = { ...existingItem, value, type };
                promises.push(updateItem(updatedItem));
            } else if (existingItem.type !== type) {
                // Type changed. This is more complex. For now, let's delete and re-add.
                promises.push(deleteItem(existingItem.id).then(() => {
                    const newItem = { path, name, type, value: type === itemTypes.LIST.type ? '' : value };
                    return addItem(newItem);
                }));
            }
        } else {
            // New item
            const newItem = {
                path,
                name,
                type,
                value: type === itemTypes.LIST.type ? '' : value,
            };
            promises.push(addItem(newItem).then((id) => {
                if (type === itemTypes.LIST.type) {
                    return syncItems(`${path}${name}/`, value);
                }
            }));
        }
    }

    // Deletions
    for (const [name, item] of existingItemsMap.entries()) {
        if (!parsedKeys.has(name)) {
            // Before deleting a list, we must delete all its children
            if (item.type === itemTypes.LIST.type) {
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
        if (item.type === itemTypes.LIST.type) {
            promises.push(deleteListRecursive(`${path}${item.name}/`));
        }
        promises.push(deleteItem(item.id));
    }
    await Promise.all(promises);
}