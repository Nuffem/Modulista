import { loadIcon } from '../icon-loader.js';
import { getItems } from '../db.js';

export const SomaType = {
    name: 'soma',
    label: 'Soma',
    icon: 'plus',
    createEditControl: (item) => {
        const p = document.createElement('p');
        p.className = 'text-gray-500';
        p.textContent = 'Este tipo de item não possui um valor editável.';
        return p;
    },
    parseValue: (editControl, item) => {
        return item.value; // No value to parse from form
    },
    formatValueForDisplay: async (item, currentPath) => {
        const children = await getItems(`${currentPath}${item.name}/`);
        return children
            .filter(child => child.type === 'number')
            .map(child => child.value)
            .join(' + ');
    },
};
