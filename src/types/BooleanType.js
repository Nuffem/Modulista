import { loadIcon } from '../icon-loader.js';

const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const BooleanType = {
    name: 'boolean',
    label: 'Booleano',
    getIcon: async () => {
        return await loadIcon('boolean', { size: iconSize, color: iconColor });
    },
    renderEditControl: (item) => {
        return `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600" ${item.value ? 'checked' : ''}>`;
    },
    parseValue: (form) => {
        return form.querySelector('[name="value"]').checked;
    },
    formatValueForDisplay: (item) => {
        // The value is rendered as a checkbox in renderItemRow, not as text
        return '';
    },
};
