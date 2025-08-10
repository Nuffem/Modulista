import { initDB, getItems, addItem, getItem, updateItem, deleteItem, updateItemsOrder } from './db.js';

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

function getItemIcon(type) {
    const iconColor = "text-gray-500";
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

async function renderListView(path) {
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path = path + '/';
    appContainer.innerHTML = `<p class="text-gray-500">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    renderBreadcrumb(path);

    try {
        let items = await getItems(path);

        const isListActive = currentView === 'list';
        const isTextActive = currentView === 'text';

        const tabsHTML = `
            <div class="mb-4 border-b border-gray-200">
                <ul class="flex flex-wrap -mb-px text-sm font-medium text-center">
                    <li class="mr-2">
                        <button id="list-tab-btn" class="inline-flex items-center p-4 border-b-2 rounded-t-lg group ${isListActive ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5m3-15H5.25c-1.12 0-2.06.914-2.06 2.033v11.934c0 1.119.94 2.033 2.06 2.033h13.5c1.12 0 2.06-.914 2.06-2.033V8.783c0-1.119-.94-2.033-2.06-2.033H5.25Z" /></svg>
                            Lista
                        </button>
                    </li>
                    <li class="mr-2">
                        <button id="text-tab-btn" class="inline-flex items-center p-4 border-b-2 rounded-t-lg group ${isTextActive ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-gray-600 hover:border-gray-300'}">
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
                    ? '<p class="text-gray-500">Nenhum item encontrado.</p>'
                    : '<ul id="item-list" class="space-y-3">' + items.map(item => {
                        const editUrl = `#/edit/${item.id}`;
                        const listUrl = `#${path}${item.name}/`;
                        const itemUrl = item.type === 'list' ? listUrl : editUrl;
                        return `
                            <li data-id="${item.id}" draggable="true" class="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-between">
                                <a href="${itemUrl}" class="flex items-center grow">
                                    <div class="mr-4">${getItemIcon(item.type)}</div>
                                    <span class="font-semibold">${item.name}</span>
                                </a>
                                <div class="flex items-center">
                                    ${item.type === 'boolean'
                                        ? `<input type="checkbox" ${item.value ? 'checked' : ''} disabled class="form-checkbox h-5 w-5 text-blue-600 mr-4">`
                                        : item.type === 'list'
                                        ? `<span class="text-sm text-gray-500 mr-4"></span>`
                                        : `<span class="text-gray-700 mr-4">${item.value}</span>`
                                    }
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-gray-400 cursor-grab handle">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                </div>
                            </li>`;
                    }).join('') + '</ul>';

                const addButtonHTML = `
                    <button data-testid="add-item-button" onclick="location.hash = '${path}add'" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center">
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
             const itemsAsText = items.map(item => {
                let value;
                if (item.type === 'list') {
                    value = `[ ... ]`;
                } else if (typeof item.value === 'string') {
                    value = `'${item.value.replace(/'/g, "\\'")}'`;
                } else {
                    value = item.value;
                }
                return `  ${item.name}: ${value}`;
            }).join(',\n');

            const textContentHTML = `
                <div class="bg-white p-4 rounded-lg shadow">
                    <div id="text-display">
                        <pre class="bg-gray-100 p-4 rounded overflow-x-auto"><code>{\n${itemsAsText}\n}</code></pre>
                        <div class="mt-4 flex justify-end">
                            <button id="edit-text-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Editar
                            </button>
                        </div>
                    </div>
                    <div id="text-edit" class="hidden">
                        <textarea id="text-editor" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300"></textarea>
                        <div class="mt-4 flex justify-end space-x-2">
                            <button id="save-text-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                                Salvar
                            </button>
                            <button id="cancel-text-btn" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            tabContent.innerHTML = textContentHTML;

            const textDisplay = document.getElementById('text-display');
            const textEdit = document.getElementById('text-edit');
            const textEditor = document.getElementById('text-editor');

            document.getElementById('edit-text-btn').addEventListener('click', () => {
                textEditor.value = `{\n${itemsAsText}\n}`;
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
                    const innerText = newText.trim().slice(1, -1).trim();
                    if (!innerText) {
                        for (const item of items) {
                            await deleteItem(item.id);
                        }
                        renderListView(path);
                        return;
                    }

                    const newItemsData = innerText.split(/,\\s*\\n/).map(line => {
                        const parts = line.split(':');
                        const name = parts[0].trim();
                        const valueStr = parts.slice(1).join(':').trim();
                        let value;
                        if (valueStr.startsWith("'") && valueStr.endsWith("'")) {
                            value = valueStr.slice(1, -1).replace(/\\'/g, "'");
                        } else if (valueStr === 'true') {
                            value = true;
                        } else if (valueStr === 'false') {
                            value = false;
                        } else if (valueStr === '[ ... ]') {
                            value = null;
                        } else {
                            value = Number(valueStr);
                            if (isNaN(value)) throw new Error(`Invalid value for ${name}`);
                        }
                        return { name, value };
                    });

                    for (const newItemData of newItemsData) {
                        const oldItem = items.find(i => i.name === newItemData.name);
                        if (oldItem && newItemData.value !== null) {
                            await updateItem({ ...oldItem, value: newItemData.value });
                        }
                    }

                    renderListView(path);
                } catch (error) {
                    console.error('Failed to parse and update items:', error);
                    alert('Erro ao salvar. Verifique a sintaxe do objeto.\\n' + error.message);
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
    appContainer.innerHTML = `<p class="text-gray-500">Carregando...</p>`;

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
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-bold mb-4">Adicionar Novo Item</h2>
                <form id="add-item-form">
                    <div class="mb-4"><label for="item-name" class="block text-gray-700 text-sm font-bold mb-2">Nome</label><input type="text" id="item-name" name="name" value="${newName}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required></div>
                    <div class="mb-4"><label for="item-type" class="block text-gray-700 text-sm font-bold mb-2">Tipo</label><select id="item-type" name="type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"><option value="text">Texto</option><option value="number">Número</option><option value="boolean">Lógico (Sim/Não)</option><option value="list">Pasta</option></select></div>
                    <div id="value-container" class="mb-4"><label for="item-value" id="item-value-label" class="block text-gray-700 text-sm font-bold mb-2">Valor</label><div id="item-value-input"><input type="text" id="item-value" name="value" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"></div></div>
                    <div class="flex items-center justify-between"><button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar</button><button type="button" onclick="history.back()" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancelar</button></div>
                </form>
            </div>`;

        const typeSelect = document.getElementById('item-type'), valueContainer = document.getElementById('value-container'), valueInputDiv = document.getElementById('item-value-input');
        typeSelect.addEventListener('change', (e) => {
            const type = e.target.value;
            if (type === 'list') valueContainer.style.display = 'none';
            else if (type === 'boolean') { valueContainer.style.display = 'block'; valueInputDiv.innerHTML = `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600">`; }
            else { valueContainer.style.display = 'block'; valueInputDiv.innerHTML = `<input type="${type === 'number' ? 'number' : 'text'}" id="item-value" name="value" value="${type === 'number' ? '0' : ''}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">`; }
        });

        document.getElementById('add-item-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target, type = form.type.value, valueEl = form.querySelector('[name="value"]');
            const newItem = { path, name: form.name.value, type, value: type === 'list' ? '' : (type === 'boolean' ? valueEl.checked : (type === 'number' ? Number(valueEl.value) : valueEl.value)) };
            try { await addItem(newItem); location.hash = path; } catch (error) { console.error('Failed to add item:', error); alert(`Erro ao salvar o item: ${error.message}`); }
        });
    } catch (error) {
        console.error('Failed to render add item view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar a página de adição de item.</p>`;
    }
}

async function renderEditItemView(itemId) {
    breadcrumbEl.style.display = 'none';
    appContainer.innerHTML = `<p class="text-gray-500">Carregando item...</p>`;
    try {
        const item = await getItem(itemId);
        if (!item) { appContainer.innerHTML = `<p class="text-red-500">Item não encontrado.</p>`; return; }

        let valueInputHTML;
        if (item.type === 'boolean') {
            valueInputHTML = `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600" ${item.value ? 'checked' : ''}>`;
        } else {
            valueInputHTML = `<input type="${item.type === 'number' ? 'number' : 'text'}" id="item-value" name="value" value="${item.value}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">`;
        }

        appContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-bold mb-4">Editar Item</h2>
                <form id="edit-item-form">
                    <div class="mb-4"><label class="block text-gray-700 text-sm font-bold mb-2">Tipo</label><p class="text-gray-800">${item.type}</p></div>
                    <div class="mb-4"><label for="item-name" class="block text-gray-700 text-sm font-bold mb-2">Nome</label><input type="text" id="item-name" name="name" value="${item.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required></div>
                    <div id="value-container" class="mb-4"><label for="item-value" class="block text-gray-700 text-sm font-bold mb-2">Valor</label>${valueInputHTML}</div>
                    <div class="flex items-center justify-between">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Alterações</button>
                        <button type="button" onclick="history.back()" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
                    </div>
                </form>
                <div class="mt-6 border-t pt-4">
                    <button id="delete-item-btn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full">Excluir Item</button>
                </div>
            </div>`;

        document.getElementById('edit-item-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target, valueEl = form.querySelector('[name="value"]');
            const updatedItem = { ...item, name: form.name.value, value: item.type === 'boolean' ? valueEl.checked : (item.type === 'number' ? Number(valueEl.value) : valueEl.value) };
            try { await updateItem(updatedItem); location.hash = item.path; } catch (error) { console.error('Failed to update item:', error); alert(`Erro ao atualizar o item: ${error.message}`); }
        });

        document.getElementById('delete-item-btn').addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
                try { await deleteItem(itemId); location.hash = item.path; } catch (error) { console.error('Failed to delete item:', error); alert('Erro ao excluir o item.'); }
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
