import { loadIcon } from '../icon-loader.js';
import { getItems, updateItemsOrder } from '../db.js';
import { itemTypes, TYPE_LIST, TYPE_BOOLEAN } from '../types/index.js';
import { renderBreadcrumb } from './breadcrumb.js';
import { renderTextContent } from './text-view.js';

function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
}

export async function renderItemRow(item) {
    const itemUrl = `#${item.path}${item.name}${item.type === TYPE_LIST ? '/' : ''}`;
    const type = itemTypes[item.type];
    const valueDisplay = type.formatValueForDisplay(item);

    const menuId = `menu-${item.id}`;
    const menuButtonId = `menu-button-${item.id}`;

    return `
        <li data-id="${item.id}" draggable="true" class="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-between dark:bg-gray-800 dark:hover:bg-gray-700">
            <a href="${itemUrl}" class="flex items-center grow">
                <div class="mr-4">${await loadIcon(type.icon)}</div>
                <span class="font-semibold">${item.name}</span>
            </a>
            <div class="flex items-center">
                <span class="text-gray-700 mr-4 dark:text-gray-300">${valueDisplay}</span>
                <div class="relative">
                    <button id="${menuButtonId}" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400">
                        ${await loadIcon('pencil', { size: 'w-5 h-5' })}
                    </button>
                    <div id="${menuId}" class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10 hidden">
                        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700" data-action="rename">Renomear</a>
                        <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700" data-action="delete">Excluir</a>
                    </div>
                </div>
                ${await loadIcon('grab-handle', { size: 'w-6 h-6', color: 'text-gray-400 dark:text-gray-500 cursor-grab handle' })}
            </div>
        </li>`;
}

import { showModal } from './modal.js';
import { updateItem, deleteItem } from '../db.js';

function setupItemMenuHandlers(container, items, path) {
    container.addEventListener('click', e => {
        const actionLink = e.target.closest('a[data-action]');
        if (actionLink) {
            e.preventDefault();
            const action = actionLink.dataset.action;
            const li = actionLink.closest('li[data-id]');
            const itemId = li.dataset.id;
            const item = items.find(i => i.id == itemId);

            if (!item) return;

            // Close the menu
            const menu = actionLink.closest('[id^="menu-"]');
            if (menu) {
                menu.classList.add('hidden');
            }

            if (action === 'rename') {
                const formContent = document.createElement('div');
                formContent.innerHTML = `
                    <form id="rename-item-form">
                        <div class="mb-4">
                            <label for="item-new-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Novo Nome</label>
                            <input type="text" id="item-new-name" name="name" value="${item.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                        </div>
                    </form>
                `;

                const actions = [
                    {
                        label: 'Cancelar',
                        className: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-200',
                        onClick: (_, closeModal) => closeModal()
                    },
                    {
                        label: 'Salvar',
                        className: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
                        onClick: async (_, closeModal) => {
                            const newName = formContent.querySelector('#item-new-name').value.trim();
                            if (newName && newName !== item.name) {
                                try {
                                    await updateItem({ ...item, name: newName });
                                    closeModal();
                                    renderListView(path);
                                } catch (error) {
                                    console.error('Failed to rename item:', error);
                                    alert(`Erro ao renomear o item: ${error.message}`);
                                }
                            } else {
                                closeModal();
                            }
                        }
                    }
                ];
                showModal('Renomear Item', formContent, actions);

            } else if (action === 'delete') {
                if (confirm(`Tem certeza que deseja excluir o item "${item.name}"? Esta ação não pode ser desfeita.`)) {
                    deleteItem(item.id).then(() => {
                        renderListView(path);
                    }).catch(error => {
                        console.error('Failed to delete item:', error);
                        alert('Erro ao excluir o item.');
                    });
                }
            }
        }

        const menuButton = e.target.closest('[id^="menu-button-"]');
        if (menuButton) {
            e.preventDefault();
            const id = menuButton.id.split('-').pop();
            const menu = document.getElementById(`menu-${id}`);

            // Close all other menus
            document.querySelectorAll('[id^="menu-"]').forEach(m => {
                if (m.id !== menu.id) {
                    m.classList.add('hidden');
                }
            });

            if (menu) {
                menu.classList.toggle('hidden');
            }
        }
    });

    // Close menus when clicking outside
    document.addEventListener('click', e => {
        if (!e.target.closest('[id^="menu-button-"]') && !e.target.closest('[id^="menu-"]')) {
            document.querySelectorAll('[id^="menu-"]').forEach(menu => {
                menu.classList.add('hidden');
            });
        }
    });
}

export async function renderListContent(path, items, containerId = 'list-content') {
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
        setupItemMenuHandlers(listContainer, items, path);
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

export async function renderListView(path) {
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path = path + '/';
    
    const appContainer = document.getElementById('app-container');
    const breadcrumbEl = document.getElementById('breadcrumb');
    
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    await renderBreadcrumb(path);

    try {
        let items = await getItems(path);

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
                setupItemMenuHandlers(listContainer, items, path);
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
            await renderTextContent(path, items, 'tab-content');
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