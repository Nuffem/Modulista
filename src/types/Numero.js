const typeDefinition = {
    name: 'number',
    rótulo: 'Número',
    ícone: 'number',
    valueType: 'number', // This item type produces number values
    createEditControl: (item) => {
        const input = document.createElement('input');
        input.type = 'number';
        input.id = 'item-value';
        input.name = 'value';
        input.value = typeof item.value === 'number' ? item.value : 0;
        input.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        return input;
    },
    parseValue: (editControl) => {
        return Number(editControl.value);
    },
    formatValueForDisplay: (item) => {
        if (typeof item.value !== 'number' || isNaN(item.value)) {
            return '0';
        }
        return String(item.value);
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
