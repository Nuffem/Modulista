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

export async function createInlineTypeSelector(parentType = null, currentPath = '/') {
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

    // Check if we have available properties and filter out reference type if so
    let hasAvailableProperties = false;
    if (parentType !== 'soma' && parentType !== 'subtracao') {
        try {
            const { getItems } = await import('../db.js');
            const items = await getItems(currentPath);
            hasAvailableProperties = items.length > 0;
            
            // Remove the "reference" type from standard types if we have available properties
            // since properties will be shown directly as reference options
            if (hasAvailableProperties) {
                typesToShow = typesToShow.filter(type => type.name !== 'reference');
            }
        } catch (error) {
            console.error('Error checking available properties:', error);
        }
    }

    // Add standard types
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

    // Add available properties as reference types (if not in soma/subtracao lists)
    if (parentType !== 'soma' && parentType !== 'subtracao') {
        try {
            const { getItems } = await import('../db.js');
            const items = await getItems(currentPath);
            
            if (items.length > 0) {
                // Add separator if there are both types and properties
                const separator = document.createElement('div');
                separator.className = 'border-t border-gray-200 dark:border-gray-600 my-1';
                typeList.appendChild(separator);

                // Add each property as a reference type option
                for (const item of items) {
                    const option = document.createElement('div');
                    option.className = 'flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer';
                    option.dataset.type = `ref:${item.name}`;
                    option.dataset.isReference = 'true';

                    const iconSpan = document.createElement('span');
                    iconSpan.className = 'mr-2';
                    iconSpan.innerHTML = await loadIcon('link', { size: 'w-5 h-5', valueType: 'reference' });

                    const labelSpan = document.createElement('span');
                    labelSpan.textContent = item.name;

                    option.appendChild(iconSpan);
                    option.appendChild(labelSpan);
                    typeList.appendChild(option);
                }
            }
        } catch (error) {
            console.error('Error loading properties for type selector:', error);
        }
    }

    container.appendChild(typeList);

    return container;
}
