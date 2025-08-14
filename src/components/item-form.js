import { itemTypes, availableTypes } from '../types/index.js';
import { loadIcon } from '../icon-loader.js';

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

    availableTypes.forEach(async type => {
        const option = document.createElement('div');
        option.className = 'flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
        option.dataset.type = type.name;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'mr-2';
        iconSpan.innerHTML = await loadIcon(type.icon, { size: 'w-5 h-5' });

        const labelSpan = document.createElement('span');
        labelSpan.textContent = type.label;

        option.appendChild(iconSpan);
        option.appendChild(labelSpan);
        typeList.appendChild(option);
    });

    container.appendChild(typeList);

    return container;
}
