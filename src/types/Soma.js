import { getItems } from '../db.js';

const typeDefinition = {
    name: 'soma',
    rótulo: 'Soma',
    ícone: 'soma',
    valueType: 'number', // This item type produces numeric values
    isExpression: true, // Mark as expression type
    navegavelEmLista: true,
    
    createEditControl: (item) => {
        const p = document.createElement('p');
        p.className = 'text-gray-500';
        p.textContent = 'Configure os valores a serem somados dentro desta expressão.';
        return p;
    },
    
    parseValue: (editControl, item) => {
        return item.value; // No value to parse from form
    },
    
    formatValueForDisplay: (item) => {
        // For expressions, show the computed value
        if (typeof item.computedValue === 'number') {
            return String(item.computedValue);
        }
        return '0'; // Default if not computed
    },
    
    // Evaluate this expression by summing child numeric values
    async evaluate(item, path) {
        try {
            const childItems = await getItems(path + item.name + '/');
            let sum = 0;
            
            for (const child of childItems) {
                if (child.type === 'number') {
                    sum += (typeof child.value === 'number' ? child.value : 0);
                } else if (child.type === 'soma' || child.type === 'subtracao') {
                    // Recursively evaluate nested expressions
                    const childType = (await import('../types.js')).itemTypes[child.type];
                    if (childType && childType.evaluate) {
                        const childResult = await childType.evaluate(child, path + item.name + '/');
                        sum += (typeof childResult === 'number' ? childResult : 0);
                    }
                }
            }
            
            return sum;
        } catch (error) {
            console.error('Error evaluating soma:', error);
            return 0;
        }
    },
    
    createListView: (mainContent, item, handleUpdate) => {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-semibold';
        nameSpan.textContent = item.name;
        mainContent.appendChild(nameSpan);
        
        // Show computed value if available
        if (typeof item.computedValue === 'number') {
            const valueSpan = document.createElement('span');
            valueSpan.className = 'text-blue-600 font-mono ml-2';
            valueSpan.textContent = `= ${item.computedValue}`;
            mainContent.appendChild(valueSpan);
        }
    }
};

export default typeDefinition;
