import { loadIcon } from '../icon-loader.js';
import { getItemByPathAndName, updateItem, deleteItem } from '../db.js';
import { itemTypes, availableTypes, TYPE_NUMBER } from '../types/index.js';
import { renderBreadcrumb } from './breadcrumb.js';
import { stringify, executePlan } from '../custom-parser.js';

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

    const formHTML = `
        <div data-id="${item.id}" draggable="false" class="p-4 bg-blue-50 rounded-lg shadow-lg dark:bg-gray-800 border border-blue-500">
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
                    <div id="item-value-input-${item.id}"></div>
                </div>
                <div class="flex items-center justify-end">
                    <button type="button" id="delete-item-btn-${item.id}" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded" title="Excluir Item">
                        ${await loadIcon('trash', { size: 'w-6 h-6' })}
                    </button>
                </div>
            </form>
        </div>`;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formHTML;

    const valueInputContainer = tempDiv.querySelector(`#item-value-input-${item.id}`);
    const valueControlElement = type.createEditControl(item);
    valueInputContainer.appendChild(valueControlElement);

    return tempDiv.firstElementChild;
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
    
    typeList.addEventListener('click', (e) => {
        if (e.target.dataset.type) {
            const newType = e.target.dataset.type;
            if (newType !== item.type) {
                const updatedItem = { ...item, type: newType, value: '' }; // Reset value on type change
                updateItem(updatedItem).then(() => {
                    renderItemTabView(`${item.path}${item.name}`);
                });
            }
            typeSelectorPopup.classList.add('hidden');
        }
    });
    
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    const handleFormChange = debounce(async () => {
        const form = document.getElementById(`edit-item-form-${item.id}`);
        if (!form) return;

        const type = itemTypes[item.type];
        const newName = form.name.value;
        const editControl = form.querySelector('[name="value"]');
        const newValue = type.parseValue(editControl, item);

        if (item.name === newName && JSON.stringify(item.value) === JSON.stringify(newValue)) {
            return;
        }

        const updatedItem = { ...item, name: newName, value: newValue };

        try {
            await updateItem(updatedItem);

            const oldName = item.name;
            item.name = newName;
            item.value = newValue;

            const codeBlock = document.getElementById(`item-text-${item.id}`);
            if (codeBlock) {
                codeBlock.textContent = 'Atualizando...';
                try {
                    const { getItems } = await import('../db.js');
                    const plan = stringify([updatedItem], updatedItem.path);
                    const str = await executePlan(plan, getItems);
                    codeBlock.textContent = str;
                } catch (error) {
                    codeBlock.textContent = `Erro ao gerar o texto: ${error.message}`;
                }
            }

            if (oldName !== newName) {
                const newPath = `${updatedItem.path}${updatedItem.name}`;
                if (history.replaceState) {
                    history.replaceState(null, '', `#${newPath}`);
                } else {
                    location.hash = newPath;
                }
                await renderBreadcrumb(updatedItem.path, updatedItem.name);
            }

        } catch (error) {
            console.error('Failed to update item:', error);
        }
    }, 300);

    formElement.querySelector('#item-name').addEventListener('input', handleFormChange);
    const valueInput = formElement.querySelector('[name="value"]');
    if (valueInput) {
        const eventType = valueInput.type === 'checkbox' ? 'change' : 'input';
        valueInput.addEventListener(eventType, handleFormChange);
    }

    formElement.querySelector(`#delete-item-btn-${item.id}`).addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
            try {
                const pathToDelete = item.path;
                await deleteItem(item.id);
                location.hash = pathToDelete;
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

        const formElement = await renderEditFormForItem(item);
        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'p-4 bg-white rounded-lg shadow dark:bg-gray-800';
        wrapperDiv.appendChild(formElement);

        appContainer.innerHTML = '';
        appContainer.appendChild(wrapperDiv);

        const form = document.getElementById(`edit-item-form-${item.id}`);
        if (form) {
            setupEditFormHandlers(item, form);
        }

    } catch (error) {
        console.error('Failed to render item detail view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar o item.</p>`;
    }
}

function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
}

export async function renderItemTabView(path) {
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

        // Get current view from app state
        const { getCurrentView } = await import('../app.js');
        const currentView = getCurrentView();
        
        const isLandscape = isLandscapeMode();
        const isListActive = currentView === 'list';
        const isTextActive = currentView === 'text';

        if (isLandscape) {
            // Side-by-side layout for landscape mode
            const sideLayoutHTML = `
                <div class="mb-4">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                                ${await loadIcon('list', { size: 'w-5 h-5 mr-2' })}
                                Lista
                            </h3>
                            <div id="item-form-content"></div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                                ${await loadIcon('code', { size: 'w-5 h-5 mr-2' })}
                                Texto
                            </h3>
                            <div id="item-text-content"></div>
                        </div>
                    </div>
                </div>
            `;
            
            appContainer.innerHTML = sideLayoutHTML;
            
            // Render both views
            await renderItemFormContent(item, 'item-form-content');
            await renderItemTextContent(item, 'item-text-content');
            
        } else {
            // Tab layout for portrait mode
            const tabsHTML = `
                <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
                    <ul class="flex -mb-px text-sm font-medium text-center">
                        <li class="flex-1">
                            <button id="list-tab-btn" class="inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${isListActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}">
                                ${await loadIcon('list', { size: 'w-5 h-5 mr-2' })}
                                Lista
                            </button>
                        </li>
                        <li class="flex-1">
                            <button id="text-tab-btn" class="inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${isTextActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}">
                                ${await loadIcon('code', { size: 'w-5 h-5 mr-2' })}
                                Texto
                            </button>
                        </li>
                    </ul>
                </div>
                <div id="tab-content"></div>
            `;

            appContainer.innerHTML = tabsHTML;
            const tabContent = document.getElementById('tab-content');

            if (isListActive) {
                await renderItemFormContent(item, 'tab-content');
            } else {
                await renderItemTextContent(item, 'tab-content');
            }

            // Add tab event listeners
            const listTabBtn = document.getElementById('list-tab-btn');
            const textTabBtn = document.getElementById('text-tab-btn');
            if (listTabBtn && textTabBtn) {
                const { setCurrentView, getCurrentView } = await import('../app.js');
                listTabBtn.addEventListener('click', () => {
                    if (getCurrentView() !== 'list') {
                        setCurrentView('list');
                        renderItemTabView(path);
                    }
                });
                textTabBtn.addEventListener('click', () => {
                    if (getCurrentView() !== 'text') {
                        setCurrentView('text');
                        renderItemTabView(path);
                    }
                });
            }
        }

    } catch (error) {
        console.error('Failed to render item tab view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar o item.</p>`;
    }
}

async function renderItemFormContent(item, containerId) {
    const container = document.getElementById(containerId);
    const formElement = await renderEditFormForItem(item);
    container.innerHTML = '';
    container.appendChild(formElement);
    
    const form = document.getElementById(`edit-item-form-${item.id}`);
    if (form) {
        setupEditFormHandlers(item, form);
    }
}

async function renderItemTextContent(item, containerId) {
    const container = document.getElementById(containerId);
    
    const textContentHTML = `
        <div class="bg-gray-100 p-4 rounded dark:bg-gray-700">
            <h4 class="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Formato de Texto:</h4>
            <pre class="bg-white p-3 rounded border text-sm overflow-x-auto dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200"><code id="item-text-${item.id}">Carregando...</code></pre>
        </div>
    `;
    container.innerHTML = textContentHTML;

    const codeBlock = document.getElementById(`item-text-${item.id}`);
    
    try {
        // Create a minimal items array containing just this item for formatting
        const items = [item];
        const plan = stringify(items, item.path);
        const { getItems } = await import('../db.js');
        
        executePlan(plan, getItems).then(str => {
            codeBlock.textContent = str;
        }).catch(error => {
            codeBlock.textContent = `Erro ao gerar o texto: ${error.message}`;
            console.error("Stringify error:", error);
        });
    } catch (error) {
        codeBlock.textContent = `Erro ao gerar o texto: ${error.message}`;
        console.error("Error rendering item text:", error);
    }
}