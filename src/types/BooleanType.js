const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const BooleanType = {
    name: 'boolean',
    label: 'Booleano',
    icon: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <path d="M12 3v18" stroke="currentColor"/>
  <path d="M15 9l3 3-4 4" stroke-width="2" stroke="currentColor" fill="none"/>
</svg>`,
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
