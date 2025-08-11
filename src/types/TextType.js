import { loadIcon } from '../icon-loader.js';

const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const TextType = {
    name: 'text',
    label: 'Texto',
    getIcon: async () => {
        return await loadIcon('text', { size: iconSize, color: iconColor });
    },
    renderEditControl: (item) => {
        return `<input type="text" id="item-value" name="value" value="${item.value}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`;
    },
    parseValue: (form) => {
        return form.querySelector('[name="value"]').value;
    },
    formatValueForDisplay: (item) => {
        return item.value;
    },
};
