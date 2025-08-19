import { addItem } from '../db.js';
import { itemTypes } from '../types.js';
import { createInlineTypeSelector } from './item-form.js';
import { displayListView } from './list-view.js';

/**
 * Auto-generates a name for numeric items in soma/subtracao lists
 * @param {string} path - The current path
 * @returns {Promise<string>} The generated name
 */
async function generateNumericItemName(path) {
    try {
        const { getItems } = await import('../db.js');
        const items = await getItems(path);
        
        // Generate simple numeric names: "1", "2", "3", etc.
        const numericNames = items
            .map(item => item.name)
            .filter(name => /^\d+$/.test(name))
            .map(name => parseInt(name, 10));
        
        const maxNumber = numericNames.length > 0 ? Math.max(...numericNames) : 0;
        return String(maxNumber + 1);
    } catch (error) {
        console.error('Error generating numeric item name:', error);
        return '1'; // fallback
    }
}

/**
 * Gets the parent item type from a given path
 * @param {string} path - The current path (e.g., '/parentName/')
 * @returns {Promise<string|null>} The parent item type or null if no parent
 */
async function getParentItemType(path) {
    if (path === '/' || !path) {
        return null; // Root level, no parent
    }
    
    // Parse path to get parent information
    // Path format: '/parentName/' or '/grandparent/parentName/'
    const pathParts = path.split('/').filter(p => p);
    
    if (pathParts.length === 0) {
        return null; // Root level
    }
    
    const parentName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.length === 1 ? '/' : '/' + pathParts.slice(0, -1).join('/') + '/';
    
    try {
        const { getItemByPathAndName } = await import('../db.js');
        const parentItem = await getItemByPathAndName(parentPath, parentName);
        return parentItem ? parentItem.type : null;
    } catch (error) {
        console.error('Error getting parent item type:', error);
        return null;
    }
}

let popupInstance = null;

function closePopup() {
    if (popupInstance) {
        popupInstance.remove();
        popupInstance = null;
    }
}

export async function showAddItemPopup(path, suggestedName) {
    if (popupInstance) {
        closePopup();
    }

    // Get parent item type to filter types if needed
    const parentType = await getParentItemType(path);

    const popup = document.createElement('div');
    popup.id = 'add-item-popup';
    popup.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

    const popupContent = document.createElement('div');
    popupContent.className = 'bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md';

    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100';
    title.textContent = 'Adicionar Novo Item';
    popupContent.appendChild(title);

    const form = document.createElement('form');
    form.id = 'add-item-form';

    // Name field - only show for non-expression parent types
    let nameInput = null;
    if (parentType !== 'soma' && parentType !== 'subtracao') {
        const nameContainer = document.createElement('div');
        nameContainer.className = 'mb-4';
        const nameLabel = document.createElement('label');
        nameLabel.htmlFor = 'new-item-name';
        nameLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
        nameLabel.textContent = 'Nome';
        nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.id = 'new-item-name';
        nameInput.name = 'name';
        nameInput.value = suggestedName;
        nameInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        nameInput.required = true;
        nameContainer.appendChild(nameLabel);
        nameContainer.appendChild(nameInput);
        form.appendChild(nameContainer);
    }

    // Type field
    const typeContainer = document.createElement('div');
    typeContainer.className = 'mb-4';
    const typeLabel = document.createElement('label');
    typeLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
    typeLabel.textContent = 'Tipo';
    const typeSelector = await createInlineTypeSelector(parentType);
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeSelector);
    form.appendChild(typeContainer);

    // Reference field (initially hidden)
    const referenceContainer = document.createElement('div');
    referenceContainer.className = 'mb-4 hidden';
    referenceContainer.id = 'reference-container';
    const referenceLabel = document.createElement('label');
    referenceLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
    referenceLabel.textContent = 'Propriedade de Referência';
    const referenceSelect = document.createElement('select');
    referenceSelect.id = 'reference-select';
    referenceSelect.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    referenceContainer.appendChild(referenceLabel);
    referenceContainer.appendChild(referenceSelect);
    form.appendChild(referenceContainer);

    // Buttons
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'flex justify-end space-x-4';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.id = 'cancel-add-item';
    cancelButton.className = 'bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded';
    cancelButton.textContent = 'Cancelar';
    cancelButton.onclick = closePopup;

    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.id = 'save-add-item';
    saveButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
    saveButton.textContent = 'Salvar';

    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(saveButton);
    form.appendChild(buttonsContainer);

    popupContent.appendChild(form);
    popup.appendChild(popupContent);
    document.body.appendChild(popup);

    popupInstance = popup;

    // Setup type selector handlers
    let selectedType = 'list';
    
    // Default to 'number' type for soma/subtração lists since only numeric types are allowed
    if (parentType === 'soma' || parentType === 'subtracao') {
        selectedType = 'number';
    }

    const typeList = popup.querySelector('#type-list');
    const typeOptions = Array.from(typeList.children);
    const typeFilter = popup.querySelector('#type-filter');

    function selectType(type) {
        selectedType = type;
        typeOptions.forEach(option => {
            if (option.dataset.type === type) {
                option.classList.add('bg-blue-100', 'dark:bg-blue-800');
            } else {
                option.classList.remove('bg-blue-100', 'dark:bg-blue-800');
            }
        });
        
        // Show/hide reference selector based on selected type
        const referenceContainer = popup.querySelector('#reference-container');
        if (type === 'reference') {
            referenceContainer.classList.remove('hidden');
            populateReferenceSelector();
        } else {
            referenceContainer.classList.add('hidden');
        }
    }

    // Function to populate the reference selector with available properties
    async function populateReferenceSelector() {
        const referenceSelect = popup.querySelector('#reference-select');
        const { getItems } = await import('../db.js');
        
        try {
            // Get all items in the current path to show as reference options
            const items = await getItems(path);
            
            // Clear existing options
            referenceSelect.innerHTML = '';
            
            // Add placeholder option
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = 'Selecione uma propriedade...';
            placeholderOption.disabled = true;
            placeholderOption.selected = true;
            referenceSelect.appendChild(placeholderOption);
            
            // Add options for each existing property
            items.forEach(item => {
                const option = document.createElement('option');
                option.value = item.name;
                option.textContent = `${item.name} (${itemTypes[item.type]?.rótulo || item.type})`;
                referenceSelect.appendChild(option);
            });
            
            // If no properties available, show appropriate message
            if (items.length === 0) {
                placeholderOption.textContent = 'Nenhuma propriedade disponível para referência';
            }
        } catch (error) {
            console.error('Error loading properties for reference:', error);
        }
    }

    // Set initial selection
    selectType(selectedType);

    typeList.addEventListener('click', (e) => {
        const option = e.target.closest('[data-type]');
        if (option) {
            selectType(option.dataset.type);
        }
    });

    typeFilter.addEventListener('input', () => {
        const filterText = typeFilter.value.toLowerCase();
        typeOptions.forEach(option => {
            const typeName = option.textContent.toLowerCase();
            if (typeName.includes(filterText)) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let newName;
        if (nameInput) {
            // Regular case - get name from input
            newName = nameInput.value.trim();
            if (!newName) {
                alert('O nome do item não pode estar vazio.');
                return;
            }
        } else {
            // Auto-generate name for soma/subtracao items
            newName = await generateNumericItemName(path);
        }

        const newItemData = {
            path,
            name: newName,
            type: selectedType,
            value: selectedType === 'reference' ? 
                popup.querySelector('#reference-select').value : ''
        };

        // Validate reference selection
        if (selectedType === 'reference') {
            const referenceValue = popup.querySelector('#reference-select').value;
            if (!referenceValue) {
                alert('Por favor, selecione uma propriedade para referenciar.');
                return;
            }
        }

        try {
            const newItem = await addItem(newItemData);
            closePopup();
            if (selectedType === 'list') {
                location.hash = `#${newItem.path}${newItem.name}`;
            } else {
                displayListView(path);
            }
        } catch (error) {
            console.error('Failed to add item:', error);
            alert(`Erro ao adicionar o item: ${error.message}`);
        }
    });
}
