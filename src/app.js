import { initDB, getItems, addItem, getItem, updateItem, deleteItem, updateItemsOrder } from './db.js';
import { parse, stringify } from './custom-parser.js';

const appContainer = document.getElementById('app-container');
const breadcrumbEl = document.getElementById('breadcrumb');

// --- State ---
let currentView = 'list'; // 'list' or 'text'

// --- Rendering Functions ---

function renderBreadcrumb(path) {
    const parts = path.split('/').filter(p => p);
    let cumulativePath = '#/';
    let html = '<div class="flex items-center">';
    html += `<button onclick="location.hash='/'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg></button>`;
    parts.forEach((part, index) => {
        cumulativePath += `${part}/`;
        html += ` <span class="text-gray-500 mx-2">/</span> <button onclick="location.hash='${cumulativePath}'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${decodeURIComponent(part)}</button>`;
    });
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

const operatorLabels = {
    'constant': 'Constante',
    'sum': 'Soma',
    'subtraction': 'Subtração',
    'multiplication': 'Multiplicação',
    'division': 'Divisão'
};

function createOperandInput(container, value, level = 0) {
    const isOperation = typeof value === 'object' && value !== null;
    const initialOperator = isOperation ? value.operator : 'constant';

    const wrapper = document.createElement('div');
    wrapper.className = `operand-wrapper space-y-2 p-2 rounded-lg ${level > 0 ? 'ml-4 bg-gray-50 dark:bg-gray-800' : ''}`;
    wrapper.dataset.level = level;

    const operatorSelect = document.createElement('select');
    operatorSelect.className = 'operator-select shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 mb-2';
    const operatorOptionsHTML = Object.entries(operatorLabels)
        .map(([op, label]) => `<option value="${op}" ${op === initialOperator ? 'selected' : ''}>${label}</option>`)
        .join('');
    operatorSelect.innerHTML = operatorOptionsHTML;
    wrapper.appendChild(operatorSelect);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'operand-content';
    wrapper.appendChild(contentDiv);

    function renderOperandContent(operator, currentValue) {
        contentDiv.innerHTML = ''; // Clear previous content

        if (operator === 'constant') {
            const numberInput = document.createElement('input');
            numberInput.type = 'number';
            numberInput.name = 'value';
            numberInput.className = 'shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
            numberInput.value = typeof currentValue === 'number' ? currentValue : 0;
            contentDiv.appendChild(numberInput);
        } else { // It's an operator
            const opValue = (typeof currentValue === 'object' && currentValue !== null) ? currentValue : { operator: operator, operands: [0, 0] };

            const operandsDiv = document.createElement('div');
            operandsDiv.className = 'operands-container space-y-2';

            createOperandInput(operandsDiv, opValue.operands[0], level + 1);
            createOperandInput(operandsDiv, opValue.operands[1], level + 1);

            contentDiv.appendChild(operandsDiv);
        }
    }

    operatorSelect.addEventListener('change', (e) => {
        const selectedOperator = e.target.value;
        const currentValue = selectedOperator === 'constant' ? 0 : { operator: selectedOperator, operands: [0, 0] };
        renderOperandContent(selectedOperator, currentValue);
    });

    container.appendChild(wrapper);
    renderOperandContent(initialOperator, value); // Initial render
}

function parseOperandInput(wrapper) {
    const operator = wrapper.querySelector('.operator-select').value;
    const contentDiv = wrapper.querySelector('.operand-content');

    if (operator === 'constant') {
        const numberInput = contentDiv.querySelector('input[name="value"]');
        return numberInput ? Number(numberInput.value) : 0;
    } else { // It's an operator
        const operandsContainer = contentDiv.querySelector('.operands-container');
        const operandWrappers = operandsContainer.querySelectorAll('.operand-wrapper');

        const operands = Array.from(operandWrappers).map(parseOperandInput);

        return { operator, operands };
    }
}


async function renderListView(path) {
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path = path + '/';
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    renderBreadcrumb(path);

    try {
        let items = await getItems(path);

        const isListActive = currentView === 'list';
        const isTextActive = currentView === 'text';

        const tabsHTML = `
            <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
                    <li class="mr-2">
                        <button id="list-tab-btn" class="inline-flex items-center p-4 border-b-2 rounded-t-lg group ${isListActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                            Lista
                        </button>
                    </li>
                    <li class="mr-2">
                        <button id="text-tab-btn" class="inline-flex items-center p-4 border-b-2 rounded-t-lg group ${isTextActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}">
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
                    : (() => {
                        const formatItemValueForDisplay = (item) => {
                            if (item.type !== 'number') {
                                return item.value;
                            }

                            const opMap = { sum: '+', subtraction: '-', multiplication: '*', division: '/' };

                            function formatOperation(value) {
                                if (typeof value !== 'object' || value === null) {
                                    return value;
                                }
                                const { operator, operands } = value;
                                if (!operands || operands.length !== 2) return 'invalid';

                                const opSymbol = opMap[operator] || '?';
                                const op1Str = formatOperation(operands[0]);
                                const op2Str = formatOperation(operands[1]);

                                return `(${op1Str} ${opSymbol} ${op2Str})`;
                            }

                            function calculate(value) {
                                if (typeof value !== 'object' || value === null) {
                                    return Number(value);
                                }
                                const { operator, operands } = value;
                                if (!operands || operands.length !== 2) return NaN;

                                const op1 = calculate(operands[0]);
                                const op2 = calculate(operands[1]);

                                switch (operator) {
                                    case 'sum': return op1 + op2;
                                    case 'subtraction': return op1 - op2;
                                    case 'multiplication': return op1 * op2;
                                    case 'division': return op2 !== 0 ? op1 / op2 : Infinity;
                                    default: return NaN;
                                }
                            }

                            if (typeof item.value !== 'object' || item.value === null) {
                                return item.value;
                            }

                            const expression = formatOperation(item.value).slice(1, -1); // Remove outer parentheses
                            const result = calculate(item.value);
                            const formattedResult = (typeof result === 'number' && !Number.isInteger(result)) ? result.toFixed(2) : result;

                            return `${expression} = ${formattedResult}`;
                        };

                        return '<ul id="item-list" class="space-y-3">' + items.map(item => {
                            const editUrl = `#/edit/${item.id}`;
                            const listUrl = `#${path}${item.name}/`;
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
                        }).join('') + '</ul>';
                    })()

                const addButtonHTML = `
                    <button data-testid="add-item-button" onclick="location.hash = '${path}add'" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                `;
                tabContent.innerHTML = listHTML + addButtonHTML;
                listContainer = document.getElementById('item-list');
                addDragAndDropHandlers(listContainer);
            }

            const addDragAndDropHandlers = (container) => {
                if (!container) return;
                let draggedItemId = null;

                container.addEventListener('dragstart', e => {
                    const target = e.target.closest('li');
                    if (target) {
                        draggedItemId = target.dataset.id;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', draggedItemId);
                        setTimeout(() => {
                            target.classList.add('opacity-50');
                        }, 0);
                    }
                });

                container.addEventListener('dragend', e => {
                    const target = e.target.closest('li');
                    if(target) {
                        target.classList.remove('opacity-50');
                    }
                });

                container.addEventListener('dragover', e => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    const target = e.target.closest('li');
                    if (target && target.dataset.id !== draggedItemId) {
                        const rect = target.getBoundingClientRect();
                        const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > .5;
                        if (next) {
                            target.parentNode.insertBefore(document.querySelector(`[data-id='${draggedItemId}']`), target.nextSibling);
                        } else {
                             target.parentNode.insertBefore(document.querySelector(`[data-id='${draggedItemId}']`), target);
                        }
                    }
                });

                container.addEventListener('drop', async e => {
                    e.preventDefault();
                    const liElements = Array.from(container.querySelectorAll('li'));
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
                        // Optionally, revert the list to its original state if DB update fails
                        renderListView(path);
                    }
                });
            }

            renderList();

        } else {
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

            stringify(items, path).then(str => {
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
                renderListView(path);
            }
        });
        document.getElementById('text-tab-btn').addEventListener('click', () => {
            if (currentView !== 'text') {
                currentView = 'text';
                renderListView(path);
            }
        });

    } catch (error) {
        console.error('Failed to render list view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar os itens.</p>`;
    }
}

async function renderAddItemView(path) {
    breadcrumbEl.style.display = 'none';
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando...</p>`;

    try {
        const items = await getItems(path);
        const baseName = "Item";
        const sameNameItems = items.filter(item => item.name.startsWith(baseName + '_'));

        let maxIndex = 0;
        sameNameItems.forEach(item => {
            const match = item.name.match(/_(\d+)$/);
            if (match) {
                const index = parseInt(match[1], 10);
                if (index > maxIndex) {
                    maxIndex = index;
                }
            }
        });
        const nextIndex = maxIndex + 1;
        const newName = `${baseName}_${nextIndex}`;

        appContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
                <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Adicionar Novo Item</h2>
                <form id="add-item-form">
                    <div class="mb-4"><label for="item-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Nome</label><input type="text" id="item-name" name="name" value="${newName}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required></div>
                    <div class="mb-4"><label for="item-type" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Tipo</label><select id="item-type" name="type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"><option value="text">Texto</option><option value="number">Número</option><option value="boolean">Lógico (Sim/Não)</option><option value="list">Lista</option></select></div>
                    <div id="value-container" class="mb-4"><label for="item-value" id="item-value-label" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Valor</label><div id="item-value-input"><input type="text" id="item-value" name="value" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"></div></div>
                    <div class="flex items-center justify-between">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </button>
                        <button type="button" onclick="history.back()" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </form>
            </div>`;

        const typeSelect = document.getElementById('item-type');
        const valueContainer = document.getElementById('value-container');
        const valueInputDiv = document.getElementById('item-value-input');

        function renderValueInput(type) {
            valueContainer.style.display = 'block'; // show by default, hide for list
            if (type === 'list') {
                valueContainer.style.display = 'none';
                valueInputDiv.innerHTML = ''; // clear
            } else if (type === 'boolean') {
                valueInputDiv.innerHTML = `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600">`;
            } else if (type === 'number') {
                // The new createOperandInput handles everything, so we just call it.
                // We pass a default value of 0, which will make it select 'constant' initially.
                createOperandInput(valueInputDiv, 0, 0);
            } else { // text
                valueInputDiv.innerHTML = `<input type="text" id="item-value" name="value" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`;
            }
        }

        typeSelect.addEventListener('change', (e) => renderValueInput(e.target.value));

        // Initial render for default selected type
        renderValueInput(typeSelect.value);

        document.getElementById('add-item-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const name = form.name.value;
            const type = form.type.value;
            let value;

            if (type === 'list') {
                value = '';
            } else if (type === 'boolean') {
                const valueEl = form.querySelector('[name="value"]');
                value = valueEl ? valueEl.checked : false;
            } else if (type === 'text') {
                const valueEl = form.querySelector('[name="value"]');
                value = valueEl ? valueEl.value : '';
            } else if (type === 'number') {
                const operandWrapper = form.querySelector('.operand-wrapper');
                if (operandWrapper) {
                    value = parseOperandInput(operandWrapper);
                } else {
                    value = 0; // Fallback
                }
            }

            const newItem = { path, name, type, value };
            try {
                await addItem(newItem);
                location.hash = path;
            } catch (error) {
                console.error('Failed to add item:', error);
                alert(`Erro ao salvar o item: ${error.message}`);
            }
        });
    } catch (error) {
        console.error('Failed to render add item view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar a página de adição de item.</p>`;
    }
}

async function renderEditItemView(itemId) {
    breadcrumbEl.style.display = 'none';
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando item...</p>`;
    try {
        const item = await getItem(itemId);
        if (!item) {
            appContainer.innerHTML = `<p class="text-red-500">Item não encontrado.</p>`;
            return;
        }

        appContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
                <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Editar Item</h2>
                <form id="edit-item-form">
                    <div class="mb-4"><label class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Tipo</label><p class="text-gray-800 dark:text-gray-200">${item.type}</p></div>
                    <div class="mb-4"><label for="item-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Nome</label><input type="text" id="item-name" name="name" value="${item.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required></div>
                    <div id="value-container" class="mb-4">
                        <label for="item-value" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Valor</label>
                        <div id="item-value-input"></div>
                    </div>
                    <div class="flex items-center justify-between">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </button>
                        <button type="button" onclick="history.back()" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </form>
                <div class="mt-6 border-t pt-4 dark:border-gray-700">
                    <button id="delete-item-btn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full">Excluir Item</button>
                </div>
            </div>`;

        const valueInputDiv = document.getElementById('item-value-input');

        if (item.type === 'boolean') {
            valueInputDiv.innerHTML = `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600" ${item.value ? 'checked' : ''}>`;
        } else if (item.type === 'text') {
            valueInputDiv.innerHTML = `<input type="text" id="item-value" name="value" value="${item.value}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`;
        } else if (item.type === 'number') {
            createOperandInput(valueInputDiv, item.value, 0);
        }

        document.getElementById('edit-item-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            let value;

            if (item.type === 'boolean') {
                value = form.querySelector('[name="value"]').checked;
            } else if (item.type === 'text') {
                value = form.querySelector('[name="value"]').value;
            } else if (item.type === 'number') {
                const operandWrapper = form.querySelector('.operand-wrapper');
                if (operandWrapper) {
                    value = parseOperandInput(operandWrapper);
                } else {
                    value = item.value; // Fallback
                }
            } else {
                value = item.value; // Keep original value if type has no input
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

        document.getElementById('delete-item-btn').addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
                try {
                    await deleteItem(itemId);
                    location.hash = item.path;
                } catch (error) {
                    console.error('Failed to delete item:', error);
                    alert('Erro ao excluir o item.');
                }
            }
        });

    } catch (error) {
        console.error('Failed to render edit view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar o item para edição.</p>`;
    }
}

// --- Router ---
function router() {
    const hash = window.location.hash.substring(1) || '/';
    if (hash.startsWith('/edit/')) {
        const itemId = hash.substring('/edit/'.length);
        renderEditItemView(itemId);
    } else if (hash.endsWith('/add')) {
        const path = hash.substring(0, hash.length - 'add'.length) || '/';
        renderAddItemView(path);
    } else {
        renderListView(hash);
    }
}

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
