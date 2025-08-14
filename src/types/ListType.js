import { loadIcon } from '../icon-loader.js';

export const ListType = {
    name: 'list',
    label: 'Lista',
    icon: 'list-square',
    createEditControl: (item) => {
        const p = document.createElement('p');
        p.className = 'text-gray-500';
        p.textContent = 'Este tipo de item não possui um valor editável.';
        return p;
    },
    parseValue: (editControl, item) => {
        return item.value; // No value to parse from form
    },
    formatValueForDisplay: (item) => {
        return ''; // No value to display
    },
};
