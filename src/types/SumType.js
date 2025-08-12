import { loadIcon } from '../icon-loader.js';

const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const SumType = {
    name: 'sum',
    label: 'Soma',
    getIcon: async () => {
        return await loadIcon('plus', { size: iconSize, color: iconColor });
    },
    renderEditControl: (item) => {
        // Convert array of numbers to string format "10 + 5 + 3"
        const value = Array.isArray(item.value) ? item.value.join(' + ') : '';
        return `<input type="text" id="item-value" name="value" value="${value}" placeholder="10 + 5 + 3" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`;
    },
    parseValue: (form) => {
        const value = form.querySelector('[name="value"]').value.trim();
        if (!value) {
            return [];
        }
        // Parse the input "10 + 5 + 3" into an array of numbers
        const numbers = value.split('+').map(n => {
            const num = parseFloat(n.trim());
            return isNaN(num) ? 0 : num;
        });
        return numbers;
    },
    formatValueForDisplay: (item) => {
        // Format array of numbers as "10 + 5 + 3" for display
        if (!Array.isArray(item.value) || item.value.length === 0) {
            return '0';
        }
        return item.value.join(' + ');
    },
};