import { getItems } from '../db.js';

const typeDefinition = {
    name: 'condicional',
    rótulo: 'Condicional',
    ícone: 'boolean', // Use boolean icon for conditional expressions
    valueType: 'mixed', // Can produce any type of value depending on condition
    isExpression: true, // Mark as expression type
    navegavelEmLista: false,
    
    createEditControl: (item) => {
        const div = document.createElement('div');
        div.className = 'space-y-2';
        
        const p = document.createElement('p');
        p.className = 'text-gray-500 text-sm';
        p.textContent = 'Expressão condicional: condição ? valorSeVerdadeiro : valorSeFalso';
        div.appendChild(p);
        
        // Text input for the conditional expression
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'item-value';
        input.name = 'value';
        input.className = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        input.placeholder = 'ex: a ? 1 : 2';
        if (item.value) {
            input.value = item.value;
        }
        div.appendChild(input);
        
        return div;
    },
    
    parseValue: (editControl) => {
        const input = editControl.querySelector('input');
        return input ? input.value : '';
    },
    
    formatValueForDisplay: (item) => {
        // For expressions, show the computed value if available
        if (item.computedValue !== undefined) {
            if (typeof item.computedValue === 'boolean') {
                return item.computedValue ? '@1' : '@0';
            }
            return String(item.computedValue);
        }
        return item.value || ''; // Show the expression if not computed
    },
    
    // Evaluate this conditional expression
    async evaluate(item, path) {
        try {
            if (!item.value) {
                return undefined;
            }
            
            // Parse the conditional expression: condition ? trueValue : falseValue
            const expression = item.value.trim();
            const questionIndex = expression.indexOf('?');
            const colonIndex = expression.lastIndexOf(':');
            
            if (questionIndex === -1 || colonIndex === -1 || questionIndex >= colonIndex) {
                console.warn(`Invalid conditional expression: ${expression}`);
                return undefined;
            }
            
            const conditionStr = expression.substring(0, questionIndex).trim();
            const trueValueStr = expression.substring(questionIndex + 1, colonIndex).trim();
            const falseValueStr = expression.substring(colonIndex + 1).trim();
            
            // Get all items in the current path for reference resolution
            const siblingItems = await getItems(path);
            
            // Evaluate the condition
            const conditionValue = await resolveValue(conditionStr, siblingItems, path);
            const isTrue = Boolean(conditionValue);
            
            // Evaluate the appropriate branch
            const resultValue = isTrue 
                ? await resolveValue(trueValueStr, siblingItems, path)
                : await resolveValue(falseValueStr, siblingItems, path);
                
            return resultValue;
        } catch (error) {
            console.error('Error evaluating conditional:', error);
            return undefined;
        }
    },
    
    createListView: (mainContent, item, handleUpdate) => {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-semibold';
        nameSpan.textContent = item.name;
        mainContent.appendChild(nameSpan);
        
        // Show the expression and computed value if available
        const expressionSpan = document.createElement('span');
        expressionSpan.className = 'text-gray-500 font-mono ml-2 text-sm';
        if (item.value) {
            expressionSpan.textContent = item.value;
        }
        mainContent.appendChild(expressionSpan);
        
        if (item.computedValue !== undefined) {
            const valueSpan = document.createElement('span');
            valueSpan.className = 'text-purple-600 font-mono ml-2';
            let displayValue = item.computedValue;
            if (typeof item.computedValue === 'boolean') {
                displayValue = item.computedValue ? '@1' : '@0';
            }
            valueSpan.textContent = `= ${displayValue}`;
            mainContent.appendChild(valueSpan);
        }
    }
};

// Helper function to resolve a value (reference, literal, or nested expression)
async function resolveValue(valueStr, siblingItems, path) {
    valueStr = valueStr.trim();
    
    // Check if it's a boolean literal
    if (valueStr === '@1') return true;
    if (valueStr === '@0') return false;
    
    // Check if it's a number literal
    const numMatch = valueStr.match(/^-?\d+(\.\d+)?$/);
    if (numMatch) {
        return parseFloat(valueStr);
    }
    
    // Check if it's a string literal
    if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
        return valueStr.slice(1, -1);
    }
    
    // Check if it's a reference to another item
    const referencedItem = siblingItems.find(item => item.name === valueStr);
    if (referencedItem) {
        // If it's an expression type, get its computed value
        if (referencedItem.computedValue !== undefined) {
            return referencedItem.computedValue;
        }
        // Otherwise return its raw value
        return referencedItem.value;
    }
    
    // If no match found, treat as literal string
    return valueStr;
}

export default typeDefinition;