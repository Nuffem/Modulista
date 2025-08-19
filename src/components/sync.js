import { getItems, addItem, updateItem, deleteItem } from '../db.js';

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
        if (valueType === 'string') type = 'text';
        else if (valueType === 'number') type = 'number';
        else if (valueType === 'boolean') type = 'boolean';
        else if (valueType === 'object' && value !== null) {
            if (value.type === 'reference') {
                type = 'reference';
            } else {
                type = 'list';
            }
        }
        else {
            console.warn(`Unsupported value type for ${name}: ${valueType}`);
            continue;
        }

        if (existingItem) {
            // Item exists, check for updates
            if (existingItem.type === 'list' && type === 'list') {
                // Recurse for lists
                promises.push(syncItems(`${path}${name}/`, value));
            } else if (existingItem.type !== 'list' && type !== 'list') {
                // For reference types, compare the reference name
                const itemValue = type === 'reference' ? value.name : value;
                const existingValue = existingItem.type === 'reference' ? existingItem.value : existingItem.value;
                
                if (existingValue !== itemValue) {
                    // Value changed, update it
                    const updatedItem = { ...existingItem, value: itemValue, type };
                    promises.push(updateItem(updatedItem));
                }
            } else if (existingItem.type !== type) {
                // Type changed. This is more complex. For now, let's delete and re-add.
                promises.push(deleteItem(existingItem.id).then(() => {
                    const itemValue = type === 'reference' ? value.name : (type === 'list' ? '' : value);
                    const newItem = { path, name, type, value: itemValue };
                    return addItem(newItem);
                }));
            }
        } else {
            // New item
            const itemValue = type === 'reference' ? value.name : (type === 'list' ? '' : value);
            const newItem = {
                path,
                name,
                type,
                value: itemValue,
            };
            promises.push(addItem(newItem).then((id) => {
                if (type === 'list') {
                    return syncItems(`${path}${name}/`, value);
                }
            }));
        }
    }

    // Deletions
    for (const [name, item] of existingItemsMap.entries()) {
        if (!parsedKeys.has(name)) {
            // Before deleting a list, we must delete all its children
            if (item.type === 'list') {
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