import { loadIcon } from '../icon-loader.js';
import { getItems, updateItemsOrder, updateItem, deleteItem } from '../db.js';
import { itemTypes } from '../types.js';
import { createBreadcrumb } from './breadcrumb.js';
import { displayTextContent } from './text-view.js';

function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

export async function createItemRow(item) {
    const type = itemTypes[item.type];

    const li = document.createElement('li');
    li.dataset.id = item.id;
    li.draggable = true;
    li.className = 'p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition flex items-start dark:bg-gray-800 dark:hover:bg-gray-700 cursor-grab';

    if (type.navegavelEmLista) {
        li.classList.replace('cursor-grab', 'cursor-pointer');
        li.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = `#${item.path}${item.name}/`;
        });
    }

    const iconContainer = document.createElement('div');
    iconContainer.className = 'mr-4 pt-1';
    iconContainer.innerHTML = await loadIcon(type.ícone);
    li.appendChild(iconContainer);

    const mainContent = document.createElement('div');
    mainContent.className = 'flex-grow';

    const handleUpdate = debounce(async (valueControl) => {
        const newValue = type.parseValue(valueControl);
        if (JSON.stringify(item.value) !== JSON.stringify(newValue)) {
            const updatedItem = { ...item, value: newValue };
            try {
                await updateItem(updatedItem);
                item.value = newValue;
            } catch (error) {
                console.error('Failed to update item:', error);
                // Restore original value in UI
                if (valueControl.type === 'checkbox') {
                    valueControl.checked = item.value;
                } else {
                    valueControl.value = item.value;
                }
            }
        }
    }, 500);

    type.createListView(mainContent, item, handleUpdate);
    li.appendChild(mainContent);

    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'flex items-center ml-2';
    li.appendChild(controlsContainer);

    const isMobile = 'ontouchstart' in window;
    if (isMobile) {
        const menuButton = document.createElement('button');
        menuButton.className = 'p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600';
        menuButton.innerHTML = await loadIcon('three-dots-vertical', { size: 'w-6 h-6' });
        menuButton.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleContextMenu(e, item, li);
        };
        controlsContainer.appendChild(menuButton);
    }

    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleContextMenu(e, item, li);
    });

    return li;
}

async function toggleContextMenu(event, item, listItemElement) {
    closeAllContextMenus();
    const menu = await createContextMenu(item, listItemElement);

    document.body.appendChild(menu);

    const menuWidth = menu.offsetWidth;
    const windowWidth = window.innerWidth;
    let left = event.clientX;

    if (left + menuWidth > windowWidth) {
        left = windowWidth - menuWidth - 5; // 5px de margem
    }

    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${left}px`;

    // Close menu when clicking outside
    document.addEventListener('click', closeAllContextMenus, { once: true });
}

async function createContextMenu(item, listItemElement) {
    const menu = document.createElement('div');
    menu.className = 'absolute z-10 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700';

    const ul = document.createElement('ul');

    // Opção Renomear
    const renameLi = document.createElement('li');
    const renameLink = document.createElement('a');
    renameLink.href = '#';
    renameLink.className = 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600';
    renameLink.innerHTML = await loadIcon('pencil', { size: 'w-4 h-4 mr-2' }) + 'Renomear';
    renameLink.addEventListener('click', (e) => {
        e.preventDefault();
        handleRenameItem(item);
        closeAllContextMenus();
    });
    renameLi.appendChild(renameLink);
    ul.appendChild(renameLi);

    // Opção Excluir
    const deleteLi = document.createElement('li');
    const deleteLink = document.createElement('a');
    deleteLink.href = '#';
    deleteLink.className = 'flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600';
    deleteLink.innerHTML = await loadIcon('trash', { size: 'w-4 h-4 mr-2' }) + 'Excluir';
    deleteLink.addEventListener('click', (e) => {
        e.preventDefault();
        handleDeleteItem(item);
        closeAllContextMenus();
    });
    deleteLi.appendChild(deleteLink);
    ul.appendChild(deleteLi);

    menu.appendChild(ul);

    return menu;
}

function closeAllContextMenus() {
    const menus = document.querySelectorAll('.absolute.z-10');
    menus.forEach(menu => menu.remove());
}

async function handleRenameItem(item) {
    const newName = prompt('Digite o novo nome do item:', item.name);
    if (newName && newName.trim() !== '' && newName !== item.name) {
        try {
            const updatedItem = { ...item, name: newName.trim() };
            await updateItem(updatedItem);
            // Refresh the view
            await displayListView(item.path);
        } catch (error) {
            console.error('Failed to rename item:', error);
            alert('Erro ao renomear o item.');
        }
    }
}

async function handleDeleteItem(item) {
    if (confirm(`Tem certeza que deseja excluir o item "${item.name}"?`)) {
        try {
            await deleteItem(item.id);
            // Refresh the view
            await displayListView(item.path);
        } catch (error) {
            console.error('Failed to delete item:', error);
            alert('Erro ao excluir o item.');
        }
    }
}

export async function displayListContent(path, items, containerId = 'list-content') {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear previous content

    if (items.length === 0) {
        const p = document.createElement('p');
        p.className = 'text-gray-500 dark:text-gray-400';
        p.textContent = 'Nenhum item encontrado.';
        container.appendChild(p);
    } else {
        const ul = document.createElement('ul');
        ul.id = 'item-list';
        ul.className = 'space-y-3';

        const itemRows = await Promise.all(items.map(item => createItemRow(item)));
        itemRows.forEach(row => ul.appendChild(row));

        container.appendChild(ul);
        addDragAndDropHandlers(ul, path, items);
    }

    const addButton = document.createElement('button');
    addButton.dataset.testid = 'add-item-button';
    addButton.title = 'Adicionar item';
    addButton.className = 'fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800';
    addButton.innerHTML = await loadIcon('plus', { size: 'w-8 h-8' });
    addButton.onclick = () => handleAddItemClick(path);
    container.appendChild(addButton);
}

function addDragAndDropHandlers(container, path, items) {
    if (!container) return;
    let draggedItemId = null;
    const isMobile = 'ontouchstart' in window;
    let canDrag = !isMobile;
    let longPressTimer;

    container.addEventListener('touchstart', e => {
        if (isMobile) {
            const target = e.target.closest('li[data-id]');
            if (!target) return;
            longPressTimer = setTimeout(() => {
                canDrag = true;
            }, 500);
        }
    }, { passive: true });

    container.addEventListener('touchend', e => {
        if (isMobile) {
            clearTimeout(longPressTimer);
            canDrag = false;
        }
    });

    container.addEventListener('touchmove', e => {
        if (isMobile) {
            clearTimeout(longPressTimer);
        }
    });

    container.addEventListener('dragstart', e => {
        if (!canDrag) {
            e.preventDefault();
            return;
        }
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
        if (isMobile) {
            canDrag = false;
        }
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
            const newItems = await getItems(path);
            await displayListContent(path, newItems, container.id);
        } catch (error) {
            console.error("Failed to update item order:", error);
            await displayListView(path);
        }
    });
}

export async function displayListView(path) {
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path = path + '/';
    
    const appContainer = document.getElementById('app-container');
    const breadcrumbEl = document.getElementById('breadcrumb');
    
    appContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    const breadcrumbContent = await createBreadcrumb(path);
    breadcrumbEl.innerHTML = '';
    breadcrumbEl.appendChild(breadcrumbContent);

    try {
        let items = await getItems(path);

        const { getCurrentView } = await import('../app.js');
        const currentView = getCurrentView();
        
        const isLandscape = isLandscapeMode();
        const isListActive = currentView === 'list';
        const isTextActive = currentView === 'text';

        appContainer.innerHTML = ''; // Clear existing content

        if (isLandscape) {
            const layoutContainer = document.createElement('div');
            layoutContainer.className = 'mb-4';

            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-2 gap-6';

            const listContainer = document.createElement('div');
            listContainer.className = 'bg-white p-4 rounded-lg shadow dark:bg-gray-800';
            const listHeader = document.createElement('h3');
            listHeader.className = 'text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center';
            listHeader.innerHTML = `${await loadIcon('list', { size: 'w-5 h-5 mr-2' })} Lista`;
            const listContent = document.createElement('div');
            listContent.id = 'list-content';
            listContainer.appendChild(listHeader);
            listContainer.appendChild(listContent);

            const textContainer = document.createElement('div');
            textContainer.className = 'bg-white p-4 rounded-lg shadow dark:bg-gray-800';
            const textHeader = document.createElement('h3');
            textHeader.className = 'text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center';
            textHeader.innerHTML = `${await loadIcon('code', { size: 'w-5 h-5 mr-2' })} Texto`;
            const textContentEl = document.createElement('div');
            textContentEl.id = 'text-content';
            textContainer.appendChild(textHeader);
            textContainer.appendChild(textContentEl);

            grid.appendChild(listContainer);
            grid.appendChild(textContainer);
            layoutContainer.appendChild(grid);
            appContainer.appendChild(layoutContainer);

            await displayListContent(path, items, 'list-content');
            await displayTextContent(path, items, 'text-content');

        } else {
            const tabsContainer = document.createElement('div');
            tabsContainer.className = 'mb-4 border-b border-gray-200 dark:border-gray-700';

            const tabList = document.createElement('ul');
            tabList.className = 'flex -mb-px text-sm font-medium text-center';

            const listTabItem = document.createElement('li');
            listTabItem.className = 'flex-1';
            const listTabBtn = document.createElement('button');
            listTabBtn.id = 'list-tab-btn';
            listTabBtn.className = `inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${isListActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}`;
            listTabBtn.innerHTML = `${await loadIcon('list', { size: 'w-5 h-5 mr-2' })} Lista`;
            listTabItem.appendChild(listTabBtn);

            const textTabItem = document.createElement('li');
            textTabItem.className = 'flex-1';
            const textTabBtn = document.createElement('button');
            textTabBtn.id = 'text-tab-btn';
            textTabBtn.className = `inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${isTextActive ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700'}`;
            textTabBtn.innerHTML = `${await loadIcon('code', { size: 'w-5 h-5 mr-2' })} Texto`;
            textTabItem.appendChild(textTabBtn);

            tabList.appendChild(listTabItem);
            tabList.appendChild(textTabItem);
            tabsContainer.appendChild(tabList);

            const tabContent = document.createElement('div');
            tabContent.id = 'tab-content';

            appContainer.appendChild(tabsContainer);
            appContainer.appendChild(tabContent);

            if (isListActive) {
                await displayListContent(path, items, 'tab-content');
            } else {
                await displayTextContent(path, items, 'tab-content');
            }

            const { setCurrentView, getCurrentView } = await import('../app.js');
            listTabBtn.addEventListener('click', () => {
                if (getCurrentView() !== 'list') {
                    setCurrentView('list');
                    displayListView(path);
                }
            });
            textTabBtn.addEventListener('click', () => {
                if (getCurrentView() !== 'text') {
                    setCurrentView('text');
                    displayListView(path);
                }
            });
        }
    } catch (error) {
        console.error('Failed to display list view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar os itens.</p>`;
    }
}