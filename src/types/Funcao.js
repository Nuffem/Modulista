const typeDefinition = {
    name: 'function',
    rótulo: 'Função',
    ícone: 'code',
    valueType: 'function', // This item type produces function values
    createEditControl: (item) => {
        const container = document.createElement('div');
        container.className = 'space-y-2';

        // Parameter input
        const paramLabel = document.createElement('label');
        paramLabel.textContent = 'Parâmetro:';
        paramLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300';
        container.appendChild(paramLabel);

        const paramInput = document.createElement('input');
        paramInput.type = 'text';
        paramInput.id = 'function-param';
        paramInput.name = 'param';
        paramInput.placeholder = 'ex: x, args';
        paramInput.value = item.value?.param || 'x';
        paramInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        container.appendChild(paramInput);

        // Expression input
        const exprLabel = document.createElement('label');
        exprLabel.textContent = 'Expressão:';
        exprLabel.className = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2';
        container.appendChild(exprLabel);

        const exprInput = document.createElement('input');
        exprInput.type = 'text';
        exprInput.id = 'function-expression';
        exprInput.name = 'expression';
        exprInput.placeholder = 'ex: x * x, args[0] + args[1]';
        exprInput.value = item.value?.expression || 'x';
        exprInput.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        container.appendChild(exprInput);

        return container;
    },
    parseValue: (editControl) => {
        const paramInput = editControl.querySelector('#function-param');
        const exprInput = editControl.querySelector('#function-expression');
        return {
            param: paramInput.value.trim() || 'x',
            expression: exprInput.value.trim() || 'x'
        };
    },
    formatValueForDisplay: (item) => {
        if (typeof item.value === 'object' && item.value.param && item.value.expression) {
            return `${item.value.param} => ${item.value.expression}`;
        }
        return item.value || '';
    },
    createListView: (mainContent, item, handleUpdate) => {
        const container = document.createElement('div');
        container.className = 'w-full';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300';
        nameLabel.textContent = item.name;
        container.appendChild(nameLabel);

        const valueSpan = document.createElement('span');
        valueSpan.className = 'text-gray-600 dark:text-gray-400 font-mono text-sm';
        valueSpan.textContent = typeDefinition.formatValueForDisplay(item);
        container.appendChild(valueSpan);

        mainContent.appendChild(container);
    }
};

export default typeDefinition;