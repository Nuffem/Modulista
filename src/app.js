import { initDB, getItems, addItem } from './db.js';
import { TYPE_TEXT } from './types/index.js';
import { router } from './components/router.js';

// --- State ---
let currentView = 'list'; // 'list' or 'text'

// State access functions for components
export function getCurrentView() {
    return currentView;
}

export function setCurrentView(view) {
    currentView = view;
}

export function createNewItem(path, items) {
    const baseName = "Item";

    // Filter items that match the pattern "Item" or "Item_number"
    const sameNameItems = items.filter(item => {
        return item.name === baseName || item.name.startsWith(baseName + '_');
    });

    let maxIndex = 0;
    if (sameNameItems.length > 0) {
        const indices = sameNameItems.map(item => {
            if (item.name === baseName) return 1; // "Item" counts as Item_1
            const match = item.name.match(/_(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
        });
        maxIndex = Math.max(...indices);
    }

    const newName = maxIndex === 0 ? baseName : `${baseName}_${maxIndex + 1}`;

    return {
        path,
        name: newName,
        type: TYPE_TEXT,
        value: ''
    };
}

export async function handleAddItemClick(path) {
    try {
        const items = await getItems(path);
        const newItemData = createNewItem(path, items);
        const newItem = await addItem(newItemData);
        location.hash = `#${newItem.path}${newItem.name}`;
    } catch (error) {
        console.error('Failed to add item:', error);
        alert(`Erro ao adicionar o item: ${error.message}`);
    }
}
window.handleAddItemClick = handleAddItemClick;

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        console.log('Database ready.');
        window.addEventListener('hashchange', router);
        
        // Re-render on window resize to handle orientation changes
        window.addEventListener('resize', () => {
            const path = window.location.hash.substring(1) || '/';
            if (path.endsWith('/')) {
                const { renderListView } = import('./components/list-view.js').then(module => {
                    module.renderListView(path);
                });
            }
        });
        
        await router();
    } catch (err) {
        console.error('Failed to initialize database:', err);
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = `<p class="text-red-500">Error: Could not initialize the database.</p>`;
    }
});
