import { loadIcon } from '../icon-loader.js';

export const TextType = {
    name: 'text',
    label: 'Texto',
    icon: 'text',
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
