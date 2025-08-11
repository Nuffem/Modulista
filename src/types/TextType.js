const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const TextType = {
    name: 'text',
    label: 'Texto',
    icon: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <text x="12" y="16" font-family="monospace" font-size="8" fill="currentColor" text-anchor="middle">abc</text>
</svg>`,
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
