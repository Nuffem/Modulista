import { loadIcon } from '../icon-loader.js';

export const ListType = {
    name: 'list',
    label: 'Lista',
    getIcon: async () => {
        return await loadIcon('folder');
    },
    renderEditControl: (item) => {
        return '<p class="text-gray-500">Este tipo de item não possui um valor editável.</p>';
    },
    parseValue: (form, item) => {
        return item.value; // No value to parse from form
    },
    formatValueForDisplay: (item) => {
        return ''; // No value to display
    },
};
