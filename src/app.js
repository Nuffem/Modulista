import { initDB, getItems, addItem, getItem, updateItem, deleteItem, updateItemsOrder, getItemByPathAndName } from './db.js';
import { parse, stringify, executePlan } from './custom-parser.js';
import { itemTypes, availableTypes, TYPE_LIST, TYPE_TEXT, TYPE_NUMBER, TYPE_BOOLEAN } from './types/index.js';
import { loadIcon } from './icon-loader.js';

const appContainer = document.getElementById('app-container');
const breadcrumbEl = document.getElementById('breadcrumb');

// --- State ---
let currentView = 'list'; // 'list' or 'text'

// Get full context path from sessionStorage or initialize to root
let fullContextPath = sessionStorage.getItem('breadcrumbContext') || '/';

// --- Helper Functions ---

function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
}

// --- Rendering Functions ---

async function renderBreadcrumb(currentPath, itemName = null) {
    // Determine what to display: always show the deepest context we've navigated to
    const contextParts = fullContextPath.split('/').filter(p => p);
    const currentParts = currentPath.split('/').filter(p => p);
    
    // If fullContextPath contains an item, we need to separate it
    let displayParts = contextParts.slice(); // Copy the array
    let contextItemName = null;
    
    // Check if fullContextPath represents an item detail view
    if (!fullContextPath.endsWith('/') && fullContextPath !== '/') {
        contextItemName = displayParts.pop(); // Remove the item name from parts
    }
    
    let cumulativePath = '#/';
    let html = '<div class="flex items-center">';
    
    // Home button - active if we're currently at root, otherwise clickable
    const isCurrentlyAtRoot = currentParts.length === 0 && !itemName;
    if (isCurrentlyAtRoot) {
        html += `<span class="bg-gray-200 text-gray-700 font-bold py-1 px-3 rounded dark:bg-gray-600 dark:text-gray-300">${await loadIcon('home', { size: 'w-5 h-5' })}</span>`;
    } else {
        html += `<button onclick="location.hash='/'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${await loadIcon('home', { size: 'w-5 h-5' })}</button>`;
    }
    
    // Show all directory parts from the context
    displayParts.forEach((part, index) => {
        cumulativePath += `${part}/`;
        
        // Check if this directory is currently being viewed
        const isCurrentDirectory = !itemName && 
            currentParts.length === index + 1 &&
            currentParts[index] === part;
        
        html += ` <span class="text-gray-500 mx-2 dark:text-gray-400">/</span> `;
        
        if (isCurrentDirectory) {
            // Current active directory - non-clickable, highlighted styling
            html += `<span class="bg-gray-200 text-gray-700 font-bold py-1 px-3 rounded dark:bg-gray-600 dark:text-gray-300">${decodeURIComponent(part)}</span>`;
        } else {
            // Clickable navigation button
            html += `<button onclick="location.hash='${cumulativePath}'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${decodeURIComponent(part)}</button>`;
        }
    });
    
    // Show item name if there's one in the context
    if (contextItemName) {
        // Check if this item is currently being viewed
        const isCurrentItem = itemName === contextItemName && 
            currentParts.length === displayParts.length &&
            currentParts.every((part, index) => displayParts[index] === part);
        
        html += ` <span class="text-gray-500 mx-2 dark:text-gray-400">/</span> `;
        if (isCurrentItem) {
            html += `<span class="bg-gray-200 text-gray-700 font-bold py-1 px-3 rounded dark:bg-gray-600 dark:text-gray-300">${contextItemName}</span>`;
        } else {
            html += `<span class="text-gray-600 font-medium dark:text-gray-400">${contextItemName}</span>`;
        }
    }
    
    html += '</div>';
    breadcrumbEl.innerHTML = html;
}

async function syncItems(path, parsedObject) {
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
        if (valueType === 'string') type = TYPE_TEXT;
        else if (valueType === 'number') type = TYPE_NUMBER;
        else if (valueType === 'boolean') type = TYPE_BOOLEAN;
        else if (valueType === 'object' && value !== null) type = TYPE_LIST;
        else {
            console.warn(`Unsupported value type for ${name}: ${valueType}`);
            continue;
        }

        if (existingItem) {
            // Item exists, check for updates
            if (existingItem.type === TYPE_LIST && type === TYPE_LIST) {
                // Recurse for lists
                promises.push(syncItems(`${path}${name}/`, value));
            } else if (existingItem.type !== TYPE_LIST && type !== TYPE_LIST && existingItem.value !== value) {
                // Value changed, update it
                const updatedItem = { ...existingItem, value, type };
                promises.push(updateItem(updatedItem));
            } else if (existingItem.type !== type) {
                // Type changed. This is more complex. For now, let's delete and re-add.
                promises.push(deleteItem(existingItem.id).then(() => {
                    const newItem = { path, name, type, value: type === TYPE_LIST ? '' : value };
                    return addItem(newItem);
                }));
            }
        } else {
            // New item
            const newItem = {
                path,
                name,
                type,
                value: type === TYPE_LIST ? '' : value,
            };
            promises.push(addItem(newItem).then((id) => {
                if (type === TYPE_LIST) {
                    return syncItems(`${path}${name}/`, value);
                }
            }));
        }
    }

    // Deletions
    for (const [name, item] of existingItemsMap.entries()) {
        if (!parsedKeys.has(name)) {
            // Before deleting a list, we must delete all its children
            if (item.type === TYPE_LIST) {
                promises.push(deleteListRecursive(`${path}${name}/`).then(() => deleteItem(item.id)));
            } else {
                promises.push(deleteItem(item.id));
            }
        }
    }

    await Promise.all(promises);
}

async function deleteListRecursive(path) {
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

function renderTypeSelector(item) {
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

async function renderListContent(path, items, containerId = 'list-content') {
    let listContainer;
    const container = document.getElementById(containerId);
    
    const renderList = async () => {
        const itemRows = await Promise.all(items.map(item => renderItemRow(item)));
        const listHTML = items.length === 0
            ? '<p class="text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>'
            : '<ul id="item-list" class="space-y-3">' + itemRows.join('') + '</ul>';

        const addButtonHTML = `
            <button data-testid="add-item-button" onclick="handleAddItemClick('${path}')" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
                ${await loadIcon('plus', { size: 'w-8 h-8' })}
            </button>
        `;
        container.innerHTML = listHTML + addButtonHTML;
        listContainer = document.getElementById('item-list');
        addDragAndDropHandlers(listContainer);
    };

    const addDragAndDropHandlers = (container) => {
        if (!container) return;
        let draggedItemId = null;

        container.addEventListener('dragstart', e => {
            const target = e.target.closest('li[data-id]');
            if (target && target.draggable) {
                draggedItemId = target.dataset.id;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedItemId);
                setTimeout(() => {
                    target.classList.add('opacity-50');
                }, 0);
            }
        });

        container.addEventListener('dragend', e => {
            const target = e.target.closest('li[data-id]');
            if(target) {
                target.classList.remove('opacity-50');
            }
        });

        container.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const target = e.target.closest('li[data-id]');
            if (target && target.dataset.id !== draggedItemId) {
                const rect = target.getBoundingClientRect();
                const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > .5;
                const draggedElement = document.querySelector(`[data-id='${draggedItemId}']`);
                if(draggedElement) {
                    if (next) {
                        target.parentNode.insertBefore(draggedElement, target.nextSibling);
                    } else {
                        target.parentNode.insertBefore(draggedElement, target);
                    }
                }
            }
        });

        container.addEventListener('drop', async e => {
            e.preventDefault();
            const liElements = Array.from(container.querySelectorAll('li[data-id]'));
            const newOrderedIds = liElements.map(li => li.dataset.id);

            const updatedItems = items.map(item => {
                const newIndex = newOrderedIds.indexOf(item.id);
                return { ...item, order: newIndex };
            });

            try {
                await updateItemsOrder(updatedItems);
                items = await getItems(path); // Refresh items from DB
                await renderList(); // Re-render the list with fresh, sorted data
            } catch (error) {
                console.error("Failed to update item order:", error);
                await renderListView(path);
            }
        });
    }

    await renderList();
}

async function renderTextContent(path, items, containerId = 'text-content') {
    const container = document.getElementById(containerId);
    
    const textContentHTML = `
        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
            <div id="text-display-${containerId}">
                <pre class="bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200"><code>Carregando...</code></pre>
                <div class="mt-4 flex justify-end space-x-2">
                    <button id="load-from-device-btn-${containerId}" title="Carregar do dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await loadIcon('upload', { size: 'w-6 h-6' })}
                    </button>
                    <button id="save-to-device-btn-${containerId}" title="Salvar no dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await loadIcon('download', { size: 'w-6 h-6' })}
                    </button>
                    <button id="edit-text-btn-${containerId}" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                        ${await loadIcon('pencil', { size: 'w-6 h-6' })}
                    </button>
                </div>
            </div>
            <div id="text-edit-${containerId}" class="hidden">
                <textarea id="text-editor-${containerId}" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"></textarea>
                <div class="mt-4 flex justify-end space-x-2">
                    <button id="save-text-btn-${containerId}" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700">
                        ${await loadIcon('check', { size: 'w-6 h-6' })}
                    </button>
                    <button id="cancel-text-btn-${containerId}" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await loadIcon('x', { size: 'w-6 h-6' })}
                    </button>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = textContentHTML;

    const textDisplay = document.getElementById(`text-display-${containerId}`);
    const textEdit = document.getElementById(`text-edit-${containerId}`);
    const textEditor = document.getElementById(`text-editor-${containerId}`);
    const codeBlock = textDisplay.querySelector('code');

    let textContent = '';

    const plan = stringify(items, path);
    executePlan(plan, getItems).then(str => {
        textContent = str;
        codeBlock.textContent = textContent;
    }).catch(error => {
        codeBlock.textContent = `Erro ao gerar o texto: ${error.message}`;
        console.error("Stringify error:", error);
    });

    document.getElementById(`load-from-device-btn-${containerId}`).addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,text/plain';

        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = event => {
                const fileContent = event.target.result;
                textEditor.value = fileContent;
                textContent = fileContent;

                textDisplay.classList.add('hidden');
                textEdit.classList.remove('hidden');
            };

            reader.onerror = event => {
                console.error("File could not be read!", event);
                alert("Erro ao ler o arquivo.");
            };

            reader.readAsText(file);
        };

        input.click();
    });

    document.getElementById(`save-to-device-btn-${containerId}`).addEventListener('click', () => {
        const text = codeBlock.textContent;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const pathParts = path.split('/').filter(p => p);
        const fileName = pathParts.length > 0 ? `${pathParts.join('_')}.txt` : 'modulista_root.txt';
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });

    document.getElementById(`edit-text-btn-${containerId}`).addEventListener('click', () => {
        textEditor.value = textContent;
        textDisplay.classList.add('hidden');
        textEdit.classList.remove('hidden');
    });

    document.getElementById(`cancel-text-btn-${containerId}`).addEventListener('click', () => {
        textEdit.classList.add('hidden');
        textDisplay.classList.remove('hidden');
    });

    document.getElementById(`save-text-btn-${containerId}`).addEventListener('click', async () => {
        const newText = textEditor.value;
        try {
            const newItemsObject = parse(newText);
            await syncItems(path, newItemsObject);
            currentView = 'list';
            await renderListView(path);
        } catch (error) {
            console.error('Failed to parse and update items:', error);
            alert('Erro ao salvar. Verifique a sintaxe.\n' + error.message);
        }
    });
}

export async function renderListView(path) {
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path = path + '/';
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    await renderBreadcrumb(path);

    try {
        let items = await getItems(path);

        const isLandscape = isLandscapeMode();
        const isListActive = currentView === 'list';
        const isTextActive = currentView === 'text';

        if (isLandscape) {
            // Side-by-side layout for landscape mode
            const sideLayoutHTML = `
                <div class="mb-4">
                    <div class="flex items-center justify-center mb-4">
                        <div class="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
                            <span class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                ${await loadIcon('list', { size: 'w-5 h-5 mr-2' })}
                                Lista
                            </span>
                            <span class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                ${await loadIcon('code', { size: 'w-5 h-5 mr-2' })}
                                Texto
                            </span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                                ${await loadIcon('list', { size: 'w-5 h-5 mr-2' })}
                                Lista
                            </h3>
                            <div id="list-content"></div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                                ${await loadIcon('code', { size: 'w-5 h-5 mr-2' })}
                                Texto
                            </h3>
                            <div id="text-content"></div>
                        </div>
                    </div>
                </div>
            `;
            
            appContainer.innerHTML = sideLayoutHTML;
            
            // Render both views
            await renderListContent(path, items, 'list-content');
            await renderTextContent(path, items, 'text-content');
            
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
            let listContainer;
            const renderList = async () => {
                const itemRows = await Promise.all(items.map(item => renderItemRow(item)));
                const listHTML = items.length === 0
                    ? '<p class="text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>'
                    : '<ul id="item-list" class="space-y-3">' + itemRows.join('') + '</ul>';

                const addButtonHTML = `
                    <button data-testid="add-item-button" onclick="handleAddItemClick('${path}')" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
                        ${await loadIcon('plus', { size: 'w-8 h-8' })}
                    </button>
                `;
                tabContent.innerHTML = listHTML + addButtonHTML;
                listContainer = document.getElementById('item-list');
                addDragAndDropHandlers(listContainer);
            };

            const addDragAndDropHandlers = (container) => {
                if (!container) return;
                let draggedItemId = null;

                container.addEventListener('dragstart', e => {
                    const target = e.target.closest('li[data-id]');
                    if (target && target.draggable) {
                        draggedItemId = target.dataset.id;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', draggedItemId);
                        setTimeout(() => {
                            target.classList.add('opacity-50');
                        }, 0);
                    }
                });

                container.addEventListener('dragend', e => {
                    const target = e.target.closest('li[data-id]');
                    if(target) {
                        target.classList.remove('opacity-50');
                    }
                });

                container.addEventListener('dragover', e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const target = e.target.closest('li[data-id]');
                    if (target && target.dataset.id !== draggedItemId) {
                        const rect = target.getBoundingClientRect();
                        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > .5;
                        const draggedElement = document.querySelector(`[data-id='${draggedItemId}']`);
                        if(draggedElement) {
                            if (next) {
                                target.parentNode.insertBefore(draggedElement, target.nextSibling);
                            } else {
                                target.parentNode.insertBefore(draggedElement, target);
                            }
                        }
                    }
                });

                container.addEventListener('drop', async e => {
                    e.preventDefault();
                    const liElements = Array.from(container.querySelectorAll('li[data-id]'));
                    const newOrderedIds = liElements.map(li => li.dataset.id);

                    const updatedItems = items.map(item => {
                        const newIndex = newOrderedIds.indexOf(item.id);
                        return { ...item, order: newIndex };
                    });

                    try {
                        await updateItemsOrder(updatedItems);
                        items = await getItems(path); // Refresh items from DB
                        await renderList(); // Re-render the list with fresh, sorted data
                    } catch (error) {
                        console.error("Failed to update item order:", error);
                        await renderListView(path);
                    }
                });
            }

            await renderList();

        } else { // Text View is Active
            const textContentHTML = `
                <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                    <div id="text-display">
                        <pre class="bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200"><code>Carregando...</code></pre>
                        <div class="mt-4 flex justify-end space-x-2">
                            <button id="load-from-device-btn" title="Carregar do dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                ${await loadIcon('upload', { size: 'w-6 h-6' })}
                            </button>
                            <button id="save-to-device-btn" title="Salvar no dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                ${await loadIcon('download', { size: 'w-6 h-6' })}
                            </button>
                            <button id="edit-text-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                                ${await loadIcon('pencil', { size: 'w-6 h-6' })}
                            </button>
                        </div>
                    </div>
                    <div id="text-edit" class="hidden">
                        <textarea id="text-editor" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"></textarea>
                        <div class="mt-4 flex justify-end space-x-2">
                            <button id="save-text-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700">
                                ${await loadIcon('check', { size: 'w-6 h-6' })}
                            </button>
                            <button id="cancel-text-btn" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                ${await loadIcon('x', { size: 'w-6 h-6' })}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            tabContent.innerHTML = textContentHTML;

            const textDisplay = document.getElementById('text-display');
            const textEdit = document.getElementById('text-edit');
            const textEditor = document.getElementById('text-editor');
            const codeBlock = textDisplay.querySelector('code');

            let textContent = '';

            const plan = stringify(items, path);
            executePlan(plan, getItems).then(str => {
                textContent = str;
                codeBlock.textContent = textContent;
            }).catch(error => {
                codeBlock.textContent = `Erro ao gerar o texto: ${error.message}`;
                console.error("Stringify error:", error);
            });

            document.getElementById('load-from-device-btn').addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.txt,text/plain';

                input.onchange = e => {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = event => {
                        const fileContent = event.target.result;
                        textEditor.value = fileContent;
                        textContent = fileContent;

                        textDisplay.classList.add('hidden');
                        textEdit.classList.remove('hidden');
                    };

                    reader.onerror = event => {
                        console.error("File could not be read!", event);
                        alert("Erro ao ler o arquivo.");
                    };

                    reader.readAsText(file);
                };

                input.click();
            });

            document.getElementById('save-to-device-btn').addEventListener('click', () => {
                const text = codeBlock.textContent;
                const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                const pathParts = path.split('/').filter(p => p);
                const fileName = pathParts.length > 0 ? `${pathParts.join('_')}.txt` : 'modulista_root.txt';
                a.download = fileName;

                document.body.appendChild(a);
                a.click();

                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
            });

            document.getElementById('edit-text-btn').addEventListener('click', () => {
                textEditor.value = textContent;
                textDisplay.classList.add('hidden');
                textEdit.classList.remove('hidden');
            });

            document.getElementById('cancel-text-btn').addEventListener('click', () => {
                textEdit.classList.add('hidden');
                textDisplay.classList.remove('hidden');
            });

            document.getElementById('save-text-btn').addEventListener('click', async () => {
                const newText = textEditor.value;
                try {
                    const newItemsObject = parse(newText);
                    await syncItems(path, newItemsObject);
                    currentView = 'list';
                    await renderListView(path);
                } catch (error) {
                    console.error('Failed to parse and update items:', error);
                    alert('Erro ao salvar. Verifique a sintaxe.\n' + error.message);
                }
            });
        }

        // Only add tab event listeners in portrait mode
        const listTabBtn = document.getElementById('list-tab-btn');
        const textTabBtn = document.getElementById('text-tab-btn');
        if (listTabBtn && textTabBtn) {
            listTabBtn.addEventListener('click', () => {
                if (currentView !== 'list') {
                    currentView = 'list';
                    renderListView(path);
                }
            });
            textTabBtn.addEventListener('click', () => {
                if (currentView !== 'text') {
                    currentView = 'text';
                    renderListView(path);
                }
            });
        }
        }

    } catch (error) {
        console.error('Failed to render list view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar os itens.</p>`;
    }
}

async function renderItemRow(item) {
    const itemUrl = `#${item.path}${item.name}${item.type === TYPE_LIST ? '/' : ''}`;
    const type = itemTypes[item.type];
    const valueDisplay = type.formatValueForDisplay(item);

    return `
        <li data-id="${item.id}" draggable="true" class="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-between dark:bg-gray-800 dark:hover:bg-gray-700">
            <a href="${itemUrl}" class="flex items-center grow">
                <div class="mr-4">${await type.getIcon()}</div>
                <span class="font-semibold">${item.name}</span>
            </a>
            <div class="flex items-center">
                ${item.type === TYPE_BOOLEAN
                    ? `<input type="checkbox" ${item.value ? 'checked' : ''} disabled class="form-checkbox h-5 w-5 text-blue-600 mr-4">`
                    : `<span class="text-gray-700 mr-4 dark:text-gray-300">${valueDisplay}</span>`
                }
                ${await loadIcon('grab-handle', { size: 'w-6 h-6', color: 'text-gray-400 dark:text-gray-500 cursor-grab handle' })}
            </div>
        </li>`;
}

async function renderEditFormForItem(item) {
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

function setupEditFormHandlers(item, formElement) {
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


async function renderItemDetailView(path) {
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

// --- Router ---
async function router() {
    const path = window.location.hash.substring(1) || '/';
    
    // Update fullContextPath to track the deepest navigation
    updateFullContextPath(path);

    if (path.endsWith('/')) {
        await renderListView(path);
    } else {
        await renderItemDetailView(path);
    }
}

// Update the full context path to maintain breadcrumb context
function updateFullContextPath(currentPath) {
    const currentParts = currentPath.split('/').filter(p => p);
    const contextParts = fullContextPath.split('/').filter(p => p);
    
    // Only update context if:
    // 1. We're navigating deeper than before, OR
    // 2. We're navigating to a different branch at the same or shallower level
    
    if (currentParts.length > contextParts.length) {
        // Navigating deeper - always update
        fullContextPath = currentPath;
        sessionStorage.setItem('breadcrumbContext', fullContextPath);
    } else if (currentParts.length === contextParts.length) {
        // Same level - update if it's different
        const isDifferent = !currentParts.every((part, index) => contextParts[index] === part);
        if (isDifferent) {
            fullContextPath = currentPath;
            sessionStorage.setItem('breadcrumbContext', fullContextPath);
        }
    }
    // If navigating to a parent (currentParts.length < contextParts.length), 
    // keep the existing context to maintain the full path display
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
                renderListView(path);
            }
        });
        
        await router();
    } catch (err) {
        console.error('Failed to initialize database:', err);
        appContainer.innerHTML = `<p class="text-red-500">Error: Could not initialize the database.</p>`;
    }
});
