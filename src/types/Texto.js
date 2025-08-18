const typeDefinition = {
    name: 'text',
    rótulo: 'Texto',
    ícone: 'text',
    valueType: 'text', // This item type produces text values
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
    createListView: (mainContent, item, handleUpdate) => {
        const nameLabel = document.createElement('label');
        nameLabel.htmlFor = `item-value-${item.id}`;
        nameLabel.className = 'block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300';
        nameLabel.textContent = item.name;
        mainContent.appendChild(nameLabel);

        const valueControl = typeDefinition.createEditControl(item);
        valueControl.id = `item-value-${item.id}`;
        mainContent.appendChild(valueControl);

        valueControl.addEventListener('input', () => handleUpdate(valueControl));
        valueControl.addEventListener('click', (e) => e.stopPropagation());
    }
};

export default typeDefinition;
