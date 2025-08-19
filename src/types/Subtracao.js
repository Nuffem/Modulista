import { getItems } from '../db.js';

const typeDefinition = {
    name: 'subtracao',
    rótulo: 'Subtração',
    ícone: 'subtracao',
    valueType: 'number', // This item type produces numeric values  
    isExpression: true, // Mark as expression type
    navegavelEmLista: true,
    
    createEditControl: (item) => {
        const p = document.createElement('p');
        p.className = 'text-gray-500';
        p.textContent = 'Configure os valores a serem subtraídos dentro desta expressão.';
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
    
    // Evaluate this expression by subtracting child numeric values
    async evaluate(item, path) {
        try {
            const childItems = await getItems(path + item.name + '/');
            let result = 0;
            let isFirst = true;
            
            for (const child of childItems) {
                let childValue = 0;
                
                if (child.type === 'number') {
                    childValue = (typeof child.value === 'number' ? child.value : 0);
                } else if (child.type === 'soma' || child.type === 'subtracao') {
                    // Recursively evaluate nested expressions
                    const childType = (await import('../types.js')).itemTypes[child.type];
                    if (childType && childType.evaluate) {
                        childValue = await childType.evaluate(child, path + item.name + '/');
                        childValue = (typeof childValue === 'number' ? childValue : 0);
                    }
                }
                
                if (isFirst) {
                    result = childValue;
                    isFirst = false;
                } else {
                    result -= childValue;
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error evaluating subtracao:', error);
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
            valueSpan.className = 'text-red-600 font-mono ml-2';
            valueSpan.textContent = `= ${item.computedValue}`;
            mainContent.appendChild(valueSpan);
        }
    }
};

export default typeDefinition;
