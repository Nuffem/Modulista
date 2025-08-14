import { itemTypes, availableTypes } from '../types/index.js';

export function createTypeSelector(item) {
    const container = document.createElement('div');
    container.className = 'relative';
    container.id = 'type-selector-container';

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'type-selector-btn';
    button.className = 'w-full text-left shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    button.textContent = itemTypes[item.type].label;
    container.appendChild(button);

    const popup = document.createElement('div');
    popup.id = 'type-selector-popup';
    popup.className = 'absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden';

    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.id = 'type-filter';
    filterInput.className = 'w-full p-2 border-b border-gray-300 dark:border-gray-600';
    filterInput.placeholder = 'Filtrar tipos...';
    popup.appendChild(filterInput);

    const typeList = document.createElement('div');
    typeList.id = 'type-list';

    availableTypes.forEach(type => {
        const option = document.createElement('div');
        option.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
        option.dataset.type = type.name;
        option.textContent = type.label;
        typeList.appendChild(option);
    });

    popup.appendChild(typeList);
    container.appendChild(popup);

    return container;
}

export function createInlineTypeSelector() {
    const container = document.createElement('div');
    container.id = 'type-selector-container';

    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.id = 'type-filter';
    filterInput.className = 'w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 mb-2';
    filterInput.placeholder = 'Filtrar tipos...';
    container.appendChild(filterInput);

    const typeList = document.createElement('div');
    typeList.id = 'type-list';
    typeList.className = 'border rounded-md max-h-40 overflow-y-auto dark:border-gray-600';

    availableTypes.forEach(type => {
        const option = document.createElement('div');
        option.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
        option.dataset.type = type.name;
        option.textContent = type.label;
        typeList.appendChild(option);
    });

    container.appendChild(typeList);

    return container;
}

export async function createEditFormForItem(item) {
    const type = itemTypes[item.type];

    const container = document.createElement('div');
    container.dataset.id = item.id;
    container.draggable = false;
    container.className = 'p-4 bg-blue-50 rounded-lg shadow-lg dark:bg-gray-800 border border-blue-500';

    const form = document.createElement('form');
    form.id = `edit-item-form-${item.id}`;

    // Name field
    const nameContainer = document.createElement('div');
    nameContainer.className = 'mb-4';
    const nameLabel = document.createElement('label');
    nameLabel.htmlFor = 'item-name';
    nameLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
    nameLabel.textContent = 'Nome';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'item-name';
    nameInput.name = 'name';
    nameInput.value = item.name;
    nameInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    nameInput.required = true;
    nameContainer.appendChild(nameLabel);
    nameContainer.appendChild(nameInput);
    form.appendChild(nameContainer);

    // Type field
    const typeContainer = document.createElement('div');
    typeContainer.className = 'mb-4';
    const typeLabel = document.createElement('label');
    typeLabel.htmlFor = 'item-type';
    typeLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
    typeLabel.textContent = 'Tipo';
    const typeSelectorContainer = document.createElement('div');
    typeSelectorContainer.id = `item-type-selector-${item.id}`;
    const typeSelector = createTypeSelector(item);
    typeSelectorContainer.appendChild(typeSelector);
    typeContainer.appendChild(typeLabel);
    typeContainer.appendChild(typeSelectorContainer);
    form.appendChild(typeContainer);

    // Value field
    const valueContainer = document.createElement('div');
    valueContainer.className = 'mb-4';
    const valueLabel = document.createElement('label');
    valueLabel.className = 'block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300';
    valueLabel.textContent = 'Valor';
    const valueInputContainer = document.createElement('div');
    valueInputContainer.id = `item-value-input-${item.id}`;
    const valueControlElement = type.createEditControl(item);
    valueInputContainer.appendChild(valueControlElement);
    valueContainer.appendChild(valueLabel);
    valueContainer.appendChild(valueInputContainer);
    form.appendChild(valueContainer);

    // Delete button
    const deleteButtonContainer = document.createElement('div');
    deleteButtonContainer.className = 'flex items-center justify-end';
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.id = `delete-item-btn-${item.id}`;
    deleteButton.className = 'bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded';
    deleteButton.title = 'Excluir Item';
    deleteButton.innerHTML = await loadIcon('trash', { size: 'w-6 h-6' });
    deleteButtonContainer.appendChild(deleteButton);
    form.appendChild(deleteButtonContainer);

    container.appendChild(form);

    return container;
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
                    displayItemTabView(`${item.path}${item.name}`);
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
                const breadcrumbEl = document.getElementById('breadcrumb');
                const breadcrumbContent = await createBreadcrumb(updatedItem.path, updatedItem.name);
                breadcrumbEl.innerHTML = '';
                breadcrumbEl.appendChild(breadcrumbContent);
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

export async function displayItemDetailView(path) {
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
        const breadcrumbContent = await createBreadcrumb(item.path, item.name);
        breadcrumbEl.innerHTML = '';
        breadcrumbEl.appendChild(breadcrumbContent);

        const formElement = await createEditFormForItem(item);
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
        console.error('Failed to display item detail view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar o item.</p>`;
    }
}

function isLandscapeMode() {
    return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
}

export async function displayItemTabView(path) {
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
        const breadcrumbContent = await createBreadcrumb(item.path, item.name);
        breadcrumbEl.innerHTML = '';
        breadcrumbEl.appendChild(breadcrumbContent);

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

            // Form View
            const formContainer = document.createElement('div');
            formContainer.className = 'bg-white p-4 rounded-lg shadow dark:bg-gray-800';
            const formHeader = document.createElement('h3');
            formHeader.className = 'text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center';
            formHeader.innerHTML = `${await loadIcon('list', { size: 'w-5 h-5 mr-2' })} Lista`;
            const formContent = document.createElement('div');
            formContent.id = 'item-form-content';
            formContainer.appendChild(formHeader);
            formContainer.appendChild(formContent);

            // Text View
            const textContainer = document.createElement('div');
            textContainer.className = 'bg-white p-4 rounded-lg shadow dark:bg-gray-800';
            const textHeader = document.createElement('h3');
            textHeader.className = 'text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center';
            textHeader.innerHTML = `${await loadIcon('code', { size: 'w-5 h-5 mr-2' })} Texto`;
            const textContent = document.createElement('div');
            textContent.id = 'item-text-content';
            textContainer.appendChild(textHeader);
            textContainer.appendChild(textContent);

            grid.appendChild(formContainer);
            grid.appendChild(textContainer);
            layoutContainer.appendChild(grid);
            appContainer.appendChild(layoutContainer);
            
            await displayItemFormContent(item, 'item-form-content');
            await displayItemTextContent(item, 'item-text-content');
            
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
                await displayItemFormContent(item, 'tab-content');
            } else {
                await displayItemTextContent(item, 'tab-content');
            }

            const { setCurrentView, getCurrentView } = await import('../app.js');
            listTabBtn.addEventListener('click', () => {
                if (getCurrentView() !== 'list') {
                    setCurrentView('list');
                    displayItemTabView(path);
                }
            });
            textTabBtn.addEventListener('click', () => {
                if (getCurrentView() !== 'text') {
                    setCurrentView('text');
                    displayItemTabView(path);
                }
            });
        }

    } catch (error) {
        console.error('Failed to display item tab view:', error);
        appContainer.innerHTML = `<p class="text-red-500">Erro ao carregar o item.</p>`;
    }
}

async function displayItemFormContent(item, containerId) {
    const container = document.getElementById(containerId);
    const formElement = await createEditFormForItem(item);
    container.innerHTML = '';
    container.appendChild(formElement);
    
    const form = document.getElementById(`edit-item-form-${item.id}`);
    if (form) {
        setupEditFormHandlers(item, form);
    }
}

async function displayItemTextContent(item, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const textContentContainer = document.createElement('div');
    textContentContainer.className = 'bg-gray-100 p-4 rounded dark:bg-gray-700';

    const header = document.createElement('h4');
    header.className = 'text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300';
    header.textContent = 'Formato de Texto:';
    textContentContainer.appendChild(header);

    const pre = document.createElement('pre');
    pre.className = 'bg-white p-3 rounded border text-sm overflow-x-auto dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200';

    const codeBlock = document.createElement('code');
    codeBlock.id = `item-text-${item.id}`;
    codeBlock.textContent = 'Carregando...';
    pre.appendChild(codeBlock);
    textContentContainer.appendChild(pre);

    container.appendChild(textContentContainer);
    
    try {
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
        console.error("Error displaying item text:", error);
    }
}