import { loadIcon } from '../icon-loader.js';

export const NumberType = {
    name: 'number',
    label: 'Número',
    getIcon: async () => {
        return await loadIcon('number');
    },
    createEditControl: (item) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'item-value';
        input.name = 'value';
        input.value = typeof item.value === 'number' ? item.value : 0;
        input.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        return input;
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
