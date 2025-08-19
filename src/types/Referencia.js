const typeDefinition = {
    name: 'reference',
    rótulo: 'Referência',
    ícone: 'link',
    valueType: 'reference', // This item type produces reference values
    createEditControl: (item, availableProperties = []) => {
        const select = document.createElement('select');
        select.id = 'item-value';
        select.name = 'value';
        select.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        
        // Add placeholder option
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = 'Selecione uma propriedade...';
        placeholderOption.disabled = true;
        select.appendChild(placeholderOption);
        
        // Add options for each available property
        availableProperties.forEach(prop => {
            const option = document.createElement('option');
            option.value = prop.name;
            option.textContent = `${prop.name} (${prop.type})`;
            if (item.value === prop.name) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        // If no current value and no properties available, select placeholder
        if (!item.value && availableProperties.length === 0) {
            placeholderOption.textContent = 'Nenhuma propriedade disponível';
            placeholderOption.selected = true;
        } else if (!item.value) {
            placeholderOption.selected = true;
        }
        
        return select;
    },
    parseValue: (editControl) => {
        return editControl.value;
    },
    formatValueForDisplay: (item) => {
        return item.value || '';
    },
    createListView: (mainContent, item, handleUpdate, availableProperties = []) => {
        const nameLabel = document.createElement('label');
        nameLabel.htmlFor = `item-value-${item.id}`;
        nameLabel.className = 'block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300';
        nameLabel.textContent = item.name;
        mainContent.appendChild(nameLabel);

        const valueControl = typeDefinition.createEditControl(item, availableProperties);
        valueControl.id = `item-value-${item.id}`;
        mainContent.appendChild(valueControl);

        valueControl.addEventListener('change', () => handleUpdate(valueControl));
        valueControl.addEventListener('click', (e) => e.stopPropagation());
    }
};

export default typeDefinition;