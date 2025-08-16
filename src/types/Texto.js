export default {
    name: 'text',
    rótulo: 'Texto',
    icon: 'text',
    createEditControl: (item) => {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'item-value';
        input.name = 'value';
        input.value = item.value;
        input.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        return input;
    },
    parseValue: (editControl) => {
        return editControl.value;
    },
    formatValueForDisplay: (item) => {
        return item.value;
    },
};
