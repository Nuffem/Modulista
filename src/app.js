import { initDB, getItems, addItem, getItem, updateItem, deleteItem, updateItemsOrder, getItemByPathAndName } from './db.js';
import { parse, stringify, executePlan } from './custom-parser.js';

const appContainer = document.getElementById('app-container');
const breadcrumbEl = document.getElementById('breadcrumb');

// --- State ---
let currentView = 'list'; // 'list' or 'text'

// --- Rendering Functions ---

function renderBreadcrumb(path, itemName = null) {
    const parts = path.split('/').filter(p => p);
    let cumulativePath = '#/';
    let html = '<div class="flex items-center">';
    html += `<button onclick="location.hash='/'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg></button>`;
    parts.forEach((part, index) => {
        cumulativePath += `${part}/`;
        html += ` <span class="text-gray-500 mx-2">/</span> <button onclick="location.hash='${cumulativePath}'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${decodeURIComponent(part)}</button>`;
    });
    if (itemName) {
        html += ` <span class="text-gray-500 mx-2">/</span> <span class="font-semibold">${itemName}</span>`;
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
        if (valueType === 'string') type = 'text';
        else if (valueType === 'number') type = 'number';
        else if (valueType === 'boolean') type = 'boolean';
        else if (valueType === 'object' && value !== null) type = 'list';
        else {
            console.warn(`Unsupported value type for ${name}: ${valueType}`);
            continue;
        }

        if (existingItem) {
            // Item exists, check for updates
            if (existingItem.type === 'list' && type === 'list') {
                // Recurse for lists
                promises.push(syncItems(`${path}${name}/`, value));
            } else if (existingItem.type !== 'list' && type !== 'list' && existingItem.value !== value) {
                // Value changed, update it
                const updatedItem = { ...existingItem, value, type };
                promises.push(updateItem(updatedItem));
            } else if (existingItem.type !== type) {
                // Type changed. This is more complex. For now, let's delete and re-add.
                promises.push(deleteItem(existingItem.id).then(() => {
                    const newItem = { path, name, type, value: type === 'list' ? '' : value };
                    return addItem(newItem);
                }));
            }
        } else {
            // New item
            const newItem = {
                path,
                name,
                type,
                value: type === 'list' ? '' : value,
            };
            promises.push(addItem(newItem).then((id) => {
                if (type === 'list') {
                    return syncItems(`${path}${name}/`, value);
                }
            }));
        }
    }

    // Deletions
    for (const [name, item] of existingItemsMap.entries()) {
        if (!parsedKeys.has(name)) {
            // Before deleting a list, we must delete all its children
            if (item.type === 'list') {
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

function getItemIcon(type) {
    const iconColor = "text-gray-500 dark:text-gray-400";
    const iconSize = "w-6 h-6";
    switch (type) {
        case 'list':
            return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${iconSize} ${iconColor}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>`;
        case 'text':
            return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <text x="12" y="16" font-family="monospace" font-size="8" fill="currentColor" text-anchor="middle">abc</text>
</svg>`;
        case 'number':
            return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <text x="12" y="16" font-family="monospace" font-size="8" fill="currentColor" text-anchor="middle">123</text>
</svg>`;
        case 'boolean':
            return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <path d="M12 3v18" stroke="currentColor"/>
  <path d="M15 9l3 3-4 4" stroke-width="2" stroke="currentColor" fill="none"/>
</svg>`;
        default:
            return '';
    }
}

export async function renderListView(path, activeItemId = null, activeItemName = null) {
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path = path + '/';
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    renderBreadcrumb(path, activeItemName);

    try {
        let items = await getItems(path);

        const isListActive = currentView === 'list';
        const isTextActive = currentView === 'text';

        const tabsHTML = `
            <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul class="flex -mb-px text-sm font-medium text-center">
                    <li class="flex-1">
                        <button id="list-tab-btn" class="inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${isListActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                            Lista
                        </button>
                    </li>
                    <li class="flex-1">
                        <button id="text-tab-btn" class="inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${isTextActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V5.75A2.25 2.25 0 0 0 18 3.5H6A2.25 2.25 0 0 0 3.75 5.75v12.5A2.25 2.25 0 0 0 6 20.25Z" /></svg>
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
            const renderList = () => {
                const listHTML = items.length === 0
                    ? '<p class="text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>'
                    : '<ul id="item-list" class="space-y-3">' + items.map(item => {
                        if (item.id === activeItemId) {
                            return renderEditFormForItem(item);
                        }
                        return renderItemRow(item);
                    }).join('') + '</ul>';

                const addButtonHTML = `
                    <button data-testid="add-item-button" onclick="handleAddItemClick('${path}')" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                `;
                tabContent.innerHTML = listHTML + addButtonHTML;
                listContainer = document.getElementById('item-list');

                if (activeItemId) {
                    const form = document.getElementById(`edit-item-form-${activeItemId}`);
                    if (form) {
                        setupEditFormHandlers(items.find(i => i.id === activeItemId), form);
                    }
                } else {
                    addDragAndDropHandlers(listContainer);
                }
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
                        renderList(); // Re-render the list with fresh, sorted data
                    } catch (error) {
                        console.error("Failed to update item order:", error);
                        renderListView(path);
                    }
                });
            }

            renderList();

        } else { // Text View is Active
            const textContentHTML = `
                <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                    <div id="text-display">
                        <pre class="bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200"><code>Carregando...</code></pre>
                        <div class="mt-4 flex justify-end space-x-2">
                            <button id="load-from-device-btn" title="Carregar do dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                            </button>
                            <button id="save-to-device-btn" title="Salvar no dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            </button>
                            <button id="edit-text-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </button>
                        </div>
                    </div>
                    <div id="text-edit" class="hidden">
                        <textarea id="text-editor" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"></textarea>
                        <div class="mt-4 flex justify-end space-x-2">
                            <button id="save-text-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </button>
                            <button id="cancel-text-btn" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
                    renderListView(path);
                } catch (error) {
                    console.error('Failed to parse and update items:', error);
                    alert('Erro ao salvar. Verifique a sintaxe.\n' + error.message);
                }
            });
        }

        document.getElementById('list-tab-btn').addEventListener('click', () => {
            if (currentView !== 'list') {
                currentView = 'list';
                renderListView(path); // Reset active item when switching tabs
            }
        });
        document.getElementById('text-tab-btn').addEventListener('click', () => {
            if (currentView !== 'text') {
                currentView = 'text';
                renderListView(path, activeItemId); // Keep active item context
            }
        });

    } catch (error) {
        console.error('Failed to render list view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar os itens.</p>`;
    }
}

function renderItemRow(item) {
    const formatItemValueForDisplay = (item) => {
        if (item.type === 'number' && typeof item.value === 'object' && item.value !== null) {
            const { operator, operands } = item.value;
            if (!operands || operands.length !== 2) return 'Invalid operands';

            const opMap = { sum: '+', subtraction: '-', multiplication: '*', division: '/' };
            const opSymbol = opMap[operator];
            if (!opSymbol) return 'Invalid operator';

            const [op1, op2] = operands;
            let result;
            switch (operator) {
                case 'sum': result = op1 + op2; break;
                case 'subtraction': result = op1 - op2; break;
                case 'multiplication': result = op1 * op2; break;
                case 'division': result = op2 !== 0 ? op1 / op2 : 'Infinity'; break;
                default: result = NaN;
            }
            const formattedResult = (typeof result === 'number' && !Number.isInteger(result)) ? result.toFixed(2) : result;
            return `${op1} ${opSymbol} ${op2} = ${formattedResult}`;
        }
        return item.value;
    };

    const listUrl = `#${item.path}${item.name}/`;
    const editUrl = `#/edit${item.path}${item.name}`;
    const itemUrl = item.type === 'list' ? listUrl : editUrl;

    return `
        <li data-id="${item.id}" draggable="true" class="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-between dark:bg-gray-800 dark:hover:bg-gray-700">
            <a href="${itemUrl}" class="flex items-center grow">
                <div class="mr-4">${getItemIcon(item.type)}</div>
                <span class="font-semibold">${item.name}</span>
            </a>
            <div class="flex items-center">
                ${item.type === 'boolean'
                    ? `<input type="checkbox" ${item.value ? 'checked' : ''} disabled class="form-checkbox h-5 w-5 text-blue-600 mr-4">`
                    : item.type === 'list'
                    ? `<span class="text-sm text-gray-500 mr-4"></span>`
                    : `<span class="text-gray-700 mr-4 dark:text-gray-300">${formatItemValueForDisplay(item)}</span>`
                }
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 dark:text-gray-500 cursor-grab handle">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
            </div>
        </li>`;
}

function renderEditFormForItem(item) {
    const valueInputHTML = (() => {
        if (item.type === 'boolean') {
            return `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600" ${item.value ? 'checked' : ''}>`;
        }
        if (item.type === 'text') {
            return `<input type="text" id="item-value" name="value" value="${item.value}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`;
        }
        if (item.type === 'number') {
            const isOperation = typeof item.value === 'object' && item.value !== null;
            const operator = isOperation ? item.value.operator : 'constant';
            const operands = isOperation ? item.value.operands : [item.value, 0];

            const operatorLabels = {
                'constant': 'Constante', 'sum': 'Soma', 'subtraction': 'Subtração',
                'multiplication': 'Multiplicação', 'division': 'Divisão'
            };
            const operatorOptionsHTML = Object.entries(operatorLabels)
                .map(([value, label]) => `<option value="${value}" ${value === operator ? 'selected' : ''}>${label}</option>`)
                .join('');

            return `
                <div id="number-operation-container">
                    <select id="number-operator" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 mb-2">
                        ${operatorOptionsHTML}
                    </select>
                    <div id="number-operands"></div>
                </div>`;
        }
        return '<p class="text-gray-500">Este tipo de item não possui um valor editável.</p>';
    })();

    return `
        <li data-id="${item.id}" draggable="false" class="p-4 bg-blue-50 rounded-lg shadow-lg dark:bg-gray-800 border border-blue-500">
            <form id="edit-item-form-${item.id}">
                <div class="mb-4">
                    <label for="item-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Nome</label>
                    <input type="text" id="item-name" name="name" value="${item.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Valor</label>
                    <div id="item-value-input-${item.id}">${valueInputHTML}</div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded dark:bg-blue-600 dark:hover:bg-blue-700" title="Salvar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </button>
                        <button type="button" onclick="location.hash='${item.path}'" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded dark:bg-gray-600 dark:hover:bg-gray-700" title="Cancelar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <button type="button" id="delete-item-btn-${item.id}" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded" title="Excluir Item">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                </div>
            </form>
        </li>`;
}

function setupEditFormHandlers(item, formElement) {
    if (item.type === 'number') {
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

    formElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        let value;

        if (item.type === 'boolean') {
            value = form.querySelector('[name="value"]').checked;
        } else if (item.type === 'text') {
            value = form.querySelector('[name="value"]').value;
        } else if (item.type === 'number') {
            const operator = form.querySelector('#number-operator').value;
            if (operator === 'constant') {
                value = Number(form.querySelector('[name="value"]').value);
            } else {
                const operand1 = Number(form.querySelector('[name="operand1"]').value);
                const operand2 = Number(form.querySelector('[name="operand2"]').value);
                value = { operator, operands: [operand1, operand2] };
            }
        } else {
            value = item.value;
        }

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


async function renderEditView(path) {
    try {
        const fullPath = path.substring('/edit'.length);
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

        if (item.type === 'list') {
            location.hash = `${item.path}${item.name}/`;
            return;
        }

        currentView = 'list';
        renderListView(item.path, item.id, item.name);
    } catch (error) {
        console.error('Failed to render item view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar o item.</p>`;
    }
}

// --- Router ---
function router() {
    const hash = window.location.hash.substring(1) || '/';
    if (hash.startsWith('/edit')) {
        renderEditView(hash);
    } else {
        renderListView(hash);
    }
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
        const newItem = await addItem(newItemData);
        location.hash = `#/edit${newItem.path}${newItem.name}`;
    } catch (error) {
        console.error('Failed to add item:', error);
        alert(`Erro ao adicionar o item: ${error.message}`);
    }
}
window.handleAddItemClick = handleAddItemClick;

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initDB().then(() => {
        console.log('Database ready.');
        window.addEventListener('hashchange', router);
        router();
    }).catch(err => {
        console.error('Failed to initialize database:', err);
        appContainer.innerHTML = `<p class="text-red-500">Error: Could not initialize the database.</p>`;
    });
});
