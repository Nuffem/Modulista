import { loadIcon } from '../icon-loader.js';

export const BooleanType = {
    name: 'boolean',
    label: 'Lógico',
    getIcon: async () => {
        return await loadIcon('boolean');
    },
    renderEditControl: (item) => {
        return `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600" ${item.value ? 'checked' : ''}>`;
    },
    parseValue: (form) => {
        return form.querySelector('[name="value"]').checked;
    },
    formatValueForDisplay: (item) => {
        return item.value ? '@1' : '@0';
    },
};
