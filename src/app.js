import { initDB, getItems, addItem } from './db.js';
import { TYPE_TEXT, availableTypes } from './types/index.js';
import { router } from './components/router.js';
import { showModal, hideModal } from './components/modal.js';
import { displayListView } from './components/list-view.js';
import { createTypeSelector } from './components/item-form.js';

// --- State ---
let currentView = 'list'; // 'list' or 'text'

// State access functions for components
export function getCurrentView() {
    return currentView;
}

export function setCurrentView(view) {
    currentView = view;
}

export async function handleAddItemClick(path) {
    const form = document.createElement('form');
    form.className = 'space-y-4';

    // Name field
    const nameContainer = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'new-item-name';
    nameLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
    nameLabel.textContent = 'Nome';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'new-item-name';
    nameInput.name = 'name';
    nameInput.className = 'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    nameInput.required = true;
    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    form.appendChild(nameContainer);

    // Type field
    const typeContainer = document.createElement('div');
    const typeLabel = document.createElement('label');
    typeLabel.htmlFor = 'new-item-type';
    typeLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
    typeLabel.textContent = 'Tipo';

    // Use a temporary item object for the type selector
    let selectedType = TYPE_TEXT;
    const tempItem = { type: selectedType };
    const typeSelectorContainer = createTypeSelector(tempItem);
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeSelectorContainer);
    form.appendChild(typeContainer);

    // Handle type selection within the modal
    const typeSelectorBtn = typeSelectorContainer.querySelector('#type-selector-btn');
    const typeList = typeSelectorContainer.querySelector('#type-list');
    typeList.addEventListener('click', (e) => {
        if (e.target.dataset.type) {
            selectedType = e.target.dataset.type;
            const itemType = availableTypes.find(t => t.name === selectedType);
            if (itemType) {
                typeSelectorBtn.textContent = itemType.label;
            }
            typeSelectorContainer.querySelector('#type-selector-popup').classList.add('hidden');
        }
    });

    const onSave = async () => {
        const newName = nameInput.value.trim();
        if (!newName) {
            alert('O nome do item não pode estar vazio.');
            return;
        }

        try {
            const newItemData = {
                path,
                name: newName,
                type: selectedType,
                value: '' // Default empty value
            };
            await addItem(newItemData);
            hideModal();
            await displayListView(path);
        } catch (error) {
            console.error('Failed to add item:', error);
            alert(`Erro ao adicionar o item: ${error.message}`);
        }
    };

    showModal('Adicionar Novo Item', form, onSave);
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
                import('./components/list-view.js').then(module => {
                    module.displayListView(path);
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
