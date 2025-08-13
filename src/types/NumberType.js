import { loadIcon } from '../icon-loader.js';

const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const NumberType = {
    name: 'number',
    label: 'Número',
    getIcon: async () => {
        return await loadIcon('number', { size: iconSize, color: iconColor });
    },
    renderEditControl: (item) => {
        const value = typeof item.value === 'number' ? item.value : 0;
        return `<input type="number" id="item-value" name="value" value="${value}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`;
    },
    parseValue: (form) => {
        return Number(form.querySelector('[name="value"]').value);
    },
    formatValueForDisplay: (item) => {
        if (typeof item.value !== 'number' || isNaN(item.value)) {
            return '0';
        }
        return String(item.value);
    },
};
