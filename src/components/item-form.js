import { loadIcon } from '../icon-loader.js';
import { getItemByPathAndName, updateItem, deleteItem } from '../db.js';
import { itemTypes, availableTypes, TYPE_NUMBER } from '../types/index.js';
import { renderBreadcrumb } from './breadcrumb.js';

export function renderTypeSelector(item) {
    const optionsHTML = availableTypes.map(type => `
        <div class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" data-type="${type.name}">
            ${type.label}
        </div>
    `).join('');

    return `
        <div class="relative" id="type-selector-container">
            <button type="button" id="type-selector-btn" class="w-full text-left shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                ${itemTypes[item.type].label}
            </button>
            <div id="type-selector-popup" class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden">
                <input type="text" id="type-filter" class="w-full p-2 border-b border-gray-300 dark:border-gray-600" placeholder="Filtrar tipos...">
                <div id="type-list">
                    ${optionsHTML}
                </div>
            </div>
        </div>
    `;
}

export async function renderEditFormForItem(item) {
    const type = itemTypes[item.type];
    const valueInputHTML = type.renderEditControl(item);

    return `
        <li data-id="${item.id}" draggable="false" class="p-4 bg-blue-50 rounded-lg shadow-lg dark:bg-gray-800 border border-blue-500">
            <form id="edit-item-form-${item.id}">
                <div class="mb-4">
                    <label for="item-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Nome</label>
                    <input type="text" id="item-name" name="name" value="${item.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                </div>
                <div class="mb-4">
                    <label for="item-type" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Tipo</label>
                    <div id="item-type-selector-${item.id}">${renderTypeSelector(item)}</div>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Valor</label>
                    <div id="item-value-input-${item.id}">${valueInputHTML}</div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded dark:bg-blue-600 dark:hover:bg-blue-700" title="Salvar">
                            ${await loadIcon('check', { size: 'w-6 h-6' })}
                        </button>
                        <button type="button" onclick="location.hash='${item.path}'" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded dark:bg-gray-600 dark:hover:bg-gray-700" title="Cancelar">
                            ${await loadIcon('x', { size: 'w-6 h-6' })}
                        </button>
                    </div>
                    <button type="button" id="delete-item-btn-${item.id}" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded" title="Excluir Item">
                        ${await loadIcon('trash', { size: 'w-6 h-6' })}
                    </button>
                </div>
            </form>
        </li>`;
}

export function setupEditFormHandlers(item, formElement) {
    const typeSelectorBtn = formElement.querySelector('#type-selector-btn');
    const typeSelectorPopup = formElement.querySelector('#type-selector-popup');

    typeSelectorBtn.addEventListener('click', () => {
        typeSelectorPopup.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!typeSelectorBtn.contains(e.target) && !typeSelectorPopup.contains(e.target)) {
            typeSelectorPopup.classList.add('hidden');
        }
    });

    const typeFilter = formElement.querySelector('#type-filter');
    const typeList = formElement.querySelector('#type-list');
    const typeOptions = Array.from(typeList.children);

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
    
    if (item.type === TYPE_NUMBER) {
        const operatorSelect = formElement.querySelector('#number-operator');
        const operandsDiv = formElement.querySelector('#number-operands');
        const isOperation = typeof item.value === 'object' && item.value !== null;
        let operands = isOperation ? item.value.operands : [item.value, 0];

        const renderOperands = (op) => {
            if (op === 'constant') {
                operandsDiv.innerHTML = `<input type="number" id="item-value" name="value" value="${operands[0]}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`;
            } else {
                operandsDiv.innerHTML = `
                    <input type="number" name="operand1" value="${operands[0]}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 mb-2" placeholder="Operando 1">
                    <input type="number" name="operand2" value="${operands[1]}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="Operando 2">
                `;
            }
        };

        renderOperands(operatorSelect.value);

        operatorSelect.addEventListener('change', (e) => {
            operands = [0, 0]; // Reset operands on change
            renderOperands(e.target.value);
        });
    }

    typeList.addEventListener('click', (e) => {
        if (e.target.dataset.type) {
            const newType = e.target.dataset.type;
            if (newType !== item.type) {
                const updatedItem = { ...item, type: newType, value: '' }; // Reset value on type change
                updateItem(updatedItem).then(() => {
                    renderItemDetailView(`${item.path}${item.name}`);
                });
            }
            typeSelectorPopup.classList.add('hidden');
        }
    });
    
    formElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const type = itemTypes[item.type];
        const value = type.parseValue(form, item);

        const updatedItem = { ...item, name: form.name.value, value };
        try {
            await updateItem(updatedItem);
            location.hash = item.path;
        } catch (error) {
            console.error('Failed to update item:', error);
            alert(`Erro ao atualizar o item: ${error.message}`);
        }
    });

    formElement.querySelector(`#delete-item-btn-${item.id}`).addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
            try {
                await deleteItem(item.id);
                location.hash = item.path;
            } catch (error) {
                console.error('Failed to delete item:', error);
                alert('Erro ao excluir o item.');
            }
        }
    });
}

export async function renderItemDetailView(path) {
    const appContainer = document.getElementById('app-container');
    const breadcrumbEl = document.getElementById('breadcrumb');
    
    try {
        const fullPath = path;
        const parts = fullPath.split('/').filter(p => p);
        const itemName = parts.pop();
        let itemPath = `/${parts.join('/')}/`;
        if (itemPath === '//') {
            itemPath = '/';
        }

        const item = await getItemByPathAndName(itemPath, itemName);

        if (!item) {
            appContainer.innerHTML = `<p class="text-red-500">Item não encontrado.</p>`;
            breadcrumbEl.innerHTML = '';
            return;
        }

        breadcrumbEl.style.display = 'block';
        await renderBreadcrumb(item.path, item.name);

        const formHTML = await renderEditFormForItem(item);
        appContainer.innerHTML = `<div class="p-4 bg-white rounded-lg shadow dark:bg-gray-800">${formHTML}</div>`;

        const form = document.getElementById(`edit-item-form-${item.id}`);
        if (form) {
            setupEditFormHandlers(item, form);
        }

    } catch (error) {
        console.error('Failed to render item detail view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar o item.</p>`;
    }
}