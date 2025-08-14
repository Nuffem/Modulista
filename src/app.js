import { initDB, getItems, addItem } from './db.js';
import { itemTypes, TYPE_TEXT } from './types/index.js';
import { router } from './components/router.js';
import { showModal } from './components/modal.js';
import { renderTypeSelector, setupTypeSelector } from './components/item-form.js';
import { renderListView } from './components/list-view.js';

// --- State ---
let currentView = 'list'; // 'list' or 'text'

// State access functions for components
export function getCurrentView() {
    return currentView;
}

export function setCurrentView(view) {
    currentView = view;
}

export function createNewItem(path, items, name, type) {
    return {
        path,
        name,
        type,
        value: ''
    };
}

export async function handleAddItemClick(path) {
    const formContent = document.createElement('div');
    const tempItem = { type: TYPE_TEXT }; // Default type for the selector

    formContent.innerHTML = `
        <form id="add-item-form">
            <div class="mb-4">
                <label for="item-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Nome</label>
                <input type="text" id="item-name" name="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
            </div>
            <div class="mb-4">
                <label for="item-type" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Tipo</label>
                <div id="item-type-selector-add"></div>
            </div>
        </form>
    `;

    const typeSelectorContainer = formContent.querySelector('#item-type-selector-add');
    typeSelectorContainer.innerHTML = renderTypeSelector(tempItem);

    const actions = [
        {
            label: 'Cancelar',
            className: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200',
            onClick: (_, closeModal) => closeModal()
        },
        {
            label: 'Salvar',
            className: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
            onClick: async (_, closeModal) => {
                const form = document.getElementById('add-item-form');
                const name = form.name.value.trim();
                const selectedType = document.getElementById('type-selector-btn').dataset.selectedType || tempItem.type;

                if (!name) {
                    alert('O nome do item é obrigatório.');
                    return;
                }

                try {
                    const items = await getItems(path);
                    const newItemData = createNewItem(path, items, name, selectedType);
                    await addItem(newItemData);
                    closeModal();
                    await renderListView(path); // Refresh the list view
                } catch (error) {
                    console.error('Failed to add item:', error);
                    alert(`Erro ao adicionar o item: ${error.message}`);
                }
            }
        }
    ];

    const closeModal = showModal('Adicionar Novo Item', formContent, actions);

    // Setup the interactive type selector
    const typeSelectorBtn = document.getElementById('type-selector-btn');
    const typeSelectorPopup = document.getElementById('type-selector-popup');
    setupTypeSelector(typeSelectorBtn, typeSelectorPopup, (newType) => {
        typeSelectorBtn.textContent = itemTypes[newType].label;
        typeSelectorBtn.dataset.selectedType = newType;
    });
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
