import { loadIcon } from '../icon-loader.js';
import { getItems } from '../db.js';

const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const SomaType = {
    name: 'soma',
    label: 'Soma',
    getIcon: async () => {
        return await loadIcon('soma', { size: iconSize, color: iconColor });
    },
    renderEditControl: (item) => {
        const path = `${item.path}${item.name}/operadores`;
        return `
            <a href="#${path}" class="flex items-center justify-between w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                <span>Operadores</span>
                <span class="text-gray-400">&gt;</span>
            </a>
        `;
    },
    parseValue: (form, item) => {
        // The value of a Soma item is the list of its children
        return null;
    },
    formatValueForDisplay: async (item) => {
        const children = await getItems(`${item.path}${item.name}/`);
        return children.map(child => child.value).join(' + ');
    },
};
