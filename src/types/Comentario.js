const typeDefinition = {
    name: 'comment',
    rótulo: 'Comentário',
    ícone: 'chat',
    valueType: 'comment', // This item type produces comment values
    createEditControl: (item) => {
        const textarea = document.createElement('textarea');
        textarea.id = 'item-value';
        textarea.name = 'value';
        textarea.value = item.value || '';
        textarea.placeholder = 'Digite seu comentário aqui...';
        textarea.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 resize-y';
        textarea.rows = 3;
        return textarea;
    },
    parseValue: (editControl) => {
        return editControl.value;
    },
    formatValueForDisplay: (item) => {
        return `// ${item.value || ''}`;
    },
    createListView: (mainContent, item, handleUpdate) => {
        const container = document.createElement('div');
        container.className = 'w-full';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300';
        nameLabel.textContent = item.name;
        container.appendChild(nameLabel);

        const valueSpan = document.createElement('span');
        valueSpan.className = 'text-gray-500 dark:text-gray-400 italic text-sm';
        valueSpan.textContent = item.value || '';
        container.appendChild(valueSpan);

        mainContent.appendChild(container);
    }
};

export default typeDefinition;