import { addItem } from '../db.js';
import { itemTypes, TYPE_TEXT } from '../types/index.js';
import { createInlineTypeSelector } from './item-form.js';

let popupInstance = null;

function closePopup() {
    if (popupInstance) {
        popupInstance.remove();
        popupInstance = null;
    }
}

export function showAddItemPopup(path, suggestedName) {
    if (popupInstance) {
        closePopup();
    }

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

    // Name field
    const nameContainer = document.createElement('div');
    nameContainer.className = 'mb-4';
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'new-item-name';
    nameLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
    nameLabel.textContent = 'Nome';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'new-item-name';
    nameInput.name = 'name';
    nameInput.value = suggestedName;
    nameInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    nameInput.required = true;
    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    form.appendChild(nameContainer);

    // Type field
    const typeContainer = document.createElement('div');
    typeContainer.className = 'mb-4';
    const typeLabel = document.createElement('label');
    typeLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
    typeLabel.textContent = 'Tipo';
    const typeSelector = createInlineTypeSelector();
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeSelector);
    form.appendChild(typeContainer);

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
    let selectedType = TYPE_TEXT;

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
        const newName = nameInput.value.trim();
        if (!newName) {
            alert('O nome do item não pode estar vazio.');
            return;
        }

        const newItemData = {
            path,
            name: newName,
            type: selectedType,
            value: ''
        };

        try {
            const newItem = await addItem(newItemData);
            closePopup();
            location.hash = `#${newItem.path}${newItem.name}`;
        } catch (error) {
            console.error('Failed to add item:', error);
            alert(`Erro ao adicionar o item: ${error.message}`);
        }
    });
}
