import { loadIcon } from '../icon-loader.js';

const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const ListType = {
    name: 'list',
    label: 'Lista',
    hasTextView: true,
    getIcon: async () => {
        return await loadIcon('folder', { size: iconSize, color: iconColor });
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
