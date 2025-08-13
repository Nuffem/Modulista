import { loadIcon } from '../icon-loader.js';

export const BooleanType = {
    name: 'boolean',
    label: 'Lógico',
    icon: 'boolean',
    createEditControl: (item) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'item-value';
        checkbox.name = 'value';
        checkbox.className = 'form-checkbox h-5 w-5 text-blue-600';
        if (item.value) {
            checkbox.checked = true;
        }
        return checkbox;
    },
    parseValue: (form) => {
        return form.querySelector('[name="value"]').checked;
    },
    formatValueForDisplay: (item) => {
        return item.value ? '@1' : '@0';
    },
};
