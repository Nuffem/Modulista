import { itemTypes, availableTypes } from '../types.js';
import { loadIcon } from '../icon-loader.js';
import { getItemByPathAndName } from '../db.js';

/**
 * Gets the parent item type from a given path
 * @param {string} path - The current path (e.g., '/parentName/')
 * @returns {Promise<string|null>} The parent item type or null if no parent
 */
async function getParentItemType(path) {
    if (path === '/' || !path) {
        return null; // Root level, no parent
    }
    
    // Parse path to get parent information
    // Path format: '/parentName/' or '/grandparent/parentName/'
    const pathParts = path.split('/').filter(p => p);
    
    if (pathParts.length === 0) {
        return null; // Root level
    }
    
    const parentName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.length === 1 ? '/' : '/' + pathParts.slice(0, -1).join('/') + '/';
    
    try {
        const parentItem = await getItemByPathAndName(parentPath, parentName);
        return parentItem ? parentItem.type : null;
    } catch (error) {
        console.error('Error getting parent item type:', error);
        return null;
    }
}

export function createTypeSelector(item, parentType = null) {
    const container = document.createElement('div');
    container.className = 'relative';
    container.id = 'type-selector-container';

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'type-selector-btn';
    button.className = 'w-full text-left shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    button.textContent = itemTypes[item.type].rótulo;
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

    // Filter types based on parent type
    let typesToShow = availableTypes;
    if (parentType === 'soma' || parentType === 'subtracao') {
        // Only show types with valueType 'number' in soma/subtração lists
        typesToShow = availableTypes.filter(type => type.valueType === 'number');
    }

    typesToShow.forEach(type => {
        const option = document.createElement('div');
        option.className = 'p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
        option.dataset.type = type.name;
        option.textContent = type.rótulo;
        typeList.appendChild(option);
    });

    popup.appendChild(typeList);
    container.appendChild(popup);

    return container;
}

export async function createInlineTypeSelector(parentType = null) {
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

    // Filter types based on parent type
    let typesToShow = availableTypes;
    if (parentType === 'soma' || parentType === 'subtracao') {
        // Only show types with valueType 'number' in soma/subtração lists
        typesToShow = availableTypes.filter(type => type.valueType === 'number');
    }

    for (const type of typesToShow) {
        const option = document.createElement('div');
        option.className = 'flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
        option.dataset.type = type.name;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'mr-2';
        iconSpan.innerHTML = await loadIcon(type.ícone, { size: 'w-5 h-5', valueType: type.valueType });

        const labelSpan = document.createElement('span');
        labelSpan.textContent = type.rótulo;

        option.appendChild(iconSpan);
        option.appendChild(labelSpan);
        typeList.appendChild(option);
    }

    container.appendChild(typeList);

    return container;
}
