import { initDB, getItems, addItem } from './db.js';
import { showAddItemPopup } from './components/add-item-popup.js';
import { displayListView } from './components/list-view.js';

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
        type: 'text',
        value: ''
    };
}

export async function handleAddItemClick(path) {
    try {
        const items = await getItems(path);
        const newItemData = createNewItem(path, items);
        showAddItemPopup(path, newItemData.name);
    } catch (error) {
        console.error('Failed to open add item popup:', error);
        alert(`Erro ao abrir o popup de adição de item: ${error.message}`);
    }
}
window.handleAddItemClick = handleAddItemClick;

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        console.log('Database ready.');

        const renderCurrentPath = async () => {
            const path = window.location.hash.substring(1) || '/';
            await displayListView(path);
        };

        window.addEventListener('hashchange', renderCurrentPath);

        let isLandscape = window.innerWidth > window.innerHeight;

        // Re-render on window resize to handle orientation changes
        window.addEventListener('resize', () => {
            const newIsLandscape = window.innerWidth > window.innerHeight;
            if (newIsLandscape !== isLandscape) {
                isLandscape = newIsLandscape;
                renderCurrentPath();
            }
        });
        
        await renderCurrentPath();
    } catch (err) {
        console.error('Failed to initialize database:', err);
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = `<p class="text-red-500">Error: Could not initialize the database.</p>`;
    }
});
