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
        return '<p class="text-gray-500">Este item navega para uma lista de operandos. Use o link "Operandos" para gerenciar os números.</p>';
    },
    parseValue: (form, item) => {
        return item.value; // No value to parse from form, like List items
    },
    formatValueForDisplay: (item) => {
        // Show "Operandos" with arrow for sum items
        return 'Operandos >';
    },
};