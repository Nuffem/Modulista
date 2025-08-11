/**
 * Determines the view to render based on the path and fetches the necessary data.
 * This is a pure function that depends only on its inputs.
 *
 * @param {string} path - The URL path from the hash.
 * @param {function} getItems - Async function to fetch all items for a given path.
 * @param {function} getItemByPathAndName - Async function to fetch a single item by its path and name.
 * @returns {Promise<object>} A description of the view to be rendered.
 */
export async function resolveRoute(path, getItems, getItemByPathAndName) {
    if (path.endsWith('/')) {
        try {
            const items = await getItems(path);
            return { view: 'list', path: path, items: items };
        } catch (error) {
            console.error(`Error fetching items for path ${path}:`, error);
            return { view: 'error', message: 'Failed to load items.' };
        }
    } else {
        const parts = path.split('/').filter(p => p);
        if (parts.length === 0) {
            // This case should ideally not be reached if paths are well-formed,
            // but as a fallback, we can treat it as the root list view.
            return resolveRoute('/', getItems, getItemByPathAndName);
        }
        const itemName = parts.pop();
        let itemPath = `/${parts.join('/')}/`;
        if (itemPath === '//') {
            itemPath = '/';
        }

        try {
            const item = await getItemByPathAndName(itemPath, itemName);
            if (item) {
                return { view: 'detail', item: item };
            } else {
                return { view: 'notFound', path: path };
            }
        } catch (error) {
            console.error(`Error fetching item for path ${path}:`, error);
            return { view: 'error', message: 'Failed to load item.' };
        }
    }
}
