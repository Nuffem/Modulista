import { loadIcon } from '../icon-loader.js';
import { getItems, updateItemsOrder } from '../db.js';
import { itemTypes, TYPE_LIST, TYPE_BOOLEAN, TYPE_SUM } from '../types/index.js';
import { renderBreadcrumb } from './breadcrumb.js';
import { renderTextContent } from './text-view.js';

function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
}

export async function renderItemRow(item) {
    let itemUrl;
    if (item.type === TYPE_LIST) {
        itemUrl = `#${item.path}${item.name}/`;
    } else if (item.type === TYPE_SUM) {
        itemUrl = `#${item.path}${item.name}/operandos`;
    } else {
        itemUrl = `#${item.path}${item.name}`;
    }
    
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

export async function renderListContent(path, items, containerId = 'list-content', context = null) {
    let listContainer;
    const container = document.getElementById(containerId);
    
    const renderList = async () => {
        const itemRows = await Promise.all(items.map(item => renderItemRow(item)));
        const listHTML = items.length === 0
            ? '<p class="text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>'
            : '<ul id="item-list" class="space-y-3">' + itemRows.join('') + '</ul>';

        // Use different add button handler for operandos context
        const addHandler = context === 'operandos' ? 'handleAddOperandoClick' : 'handleAddItemClick';
        const addButtonHTML = `
            <button data-testid="add-item-button" onclick="${addHandler}('${path}')" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
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

export async function renderListView(path, context = null) {
    // Handle operandos context - extract the actual data path
    let actualPath = path;
    if (context === 'operandos' && path.endsWith('/operandos')) {
        actualPath = path.substring(0, path.length - '/operandos'.length) + '/';
    } else {
        if (!path.startsWith('/')) actualPath = '/' + path;
        if (!path.endsWith('/')) actualPath = path + '/';
    }
    
    const appContainer = document.getElementById('app-container');
    const breadcrumbEl = document.getElementById('breadcrumb');
    
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    await renderBreadcrumb(path);

    try {
        let items = await getItems(actualPath);

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
            await renderListContent(actualPath, items, 'list-content', context);
            await renderTextContent(actualPath, items, 'text-content');
            
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

                // Use different add button handler for operandos context
                const addHandler = context === 'operandos' ? 'handleAddOperandoClick' : 'handleAddItemClick';
                const addButtonHTML = `
                    <button data-testid="add-item-button" onclick="${addHandler}('${actualPath}')" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
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

            const { stringify, executePlan } = await import('../custom-parser.js');
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
                    const { parse } = await import('../custom-parser.js');
                    const { syncItems } = await import('./sync.js');
                    const newItemsObject = parse(newText);
                    await syncItems(path, newItemsObject);
                    
                    const { setCurrentView } = await import('../app.js');
                    setCurrentView('list');
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
            const { setCurrentView, getCurrentView } = await import('../app.js');
            listTabBtn.addEventListener('click', () => {
                if (getCurrentView() !== 'list') {
                    setCurrentView('list');
                    renderListView(path);
                }
            });
            textTabBtn.addEventListener('click', () => {
                if (getCurrentView() !== 'text') {
                    setCurrentView('text');
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