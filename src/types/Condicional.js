import { getItems } from '../db.js';

const typeDefinition = {
    name: 'condicional',
    rótulo: 'Condicional',
    ícone: 'boolean', // Use boolean icon for conditional expressions
    valueType: 'mixed', // Can produce any type of value depending on condition
    isExpression: true, // Mark as expression type
    navegavelEmLista: false,
    
    createEditControl: (item) => {
        // For backward compatibility, keep the single input approach for the edit dialog
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
        
        // Support both old string format and new object format
        if (item.value) {
            if (typeof item.value === 'object') {
                // Convert object format to string for backward compatibility
                const condition = item.value.condition || '';
                const trueValue = item.value.trueValue || '';
                const falseValue = item.value.falseValue || '';
                input.value = `${condition} ? ${trueValue} : ${falseValue}`;
            } else {
                input.value = item.value;
            }
        }
        div.appendChild(input);
        
        return div;
    },
    
    parseValue: (editControl) => {
        // Handle the main edit control (single input for backward compatibility)
        const input = editControl.querySelector('input[id="item-value"]');
        if (input) {
            return input.value;
        }
        
        // Handle the list view control (three separate inputs)
        const conditionInput = editControl.querySelector('input[name="condition"]');
        const trueInput = editControl.querySelector('input[name="trueValue"]');
        const falseInput = editControl.querySelector('input[name="falseValue"]');
        
        if (conditionInput || trueInput || falseInput) {
            return {
                condition: conditionInput ? conditionInput.value : '',
                trueValue: trueInput ? trueInput.value : '',
                falseValue: falseInput ? falseInput.value : ''
            };
        }
        
        // Fallback
        const anyInput = editControl.querySelector('input');
        return anyInput ? anyInput.value : '';
    },
    
    formatValueForDisplay: (item) => {
        // For expressions, show the computed value if available
        if (item.computedValue !== undefined) {
            if (typeof item.computedValue === 'boolean') {
                return item.computedValue ? '@1' : '@0';
            }
            return String(item.computedValue);
        }
        
        // Show the structured format for new format
        if (item.value && typeof item.value === 'object') {
            return `${item.value.condition || ''} ? ${item.value.trueValue || ''} : ${item.value.falseValue || ''}`;
        }
        
        return item.value || ''; // Show the legacy expression if not computed
    },
    
    // Evaluate this conditional expression
    async evaluate(item, path) {
        try {
            if (!item.value) {
                return undefined;
            }
            
            let conditionStr, trueValueStr, falseValueStr;
            
            // Handle new object format
            if (typeof item.value === 'object') {
                conditionStr = item.value.condition || '';
                trueValueStr = item.value.trueValue || '';
                falseValueStr = item.value.falseValue || '';
            } else if (typeof item.value === 'string') {
                // Handle legacy string format: condition ? trueValue : falseValue
                const expression = item.value.trim();
                const questionIndex = expression.indexOf('?');
                const colonIndex = expression.lastIndexOf(':');
                
                if (questionIndex === -1 || colonIndex === -1 || questionIndex >= colonIndex) {
                    console.warn(`Invalid conditional expression: ${expression}`);
                    return undefined;
                }
                
                conditionStr = expression.substring(0, questionIndex).trim();
                trueValueStr = expression.substring(questionIndex + 1, colonIndex).trim();
                falseValueStr = expression.substring(colonIndex + 1).trim();
            } else {
                return undefined;
            }
            
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
        const container = document.createElement('div');
        container.className = 'space-y-2 w-full';
        
        // Item name label
        const nameLabel = document.createElement('div');
        nameLabel.className = 'font-semibold text-gray-900 dark:text-gray-100 mb-2';
        nameLabel.textContent = item.name;
        container.appendChild(nameLabel);
        
        // Condition field
        const conditionLabel = document.createElement('label');
        conditionLabel.className = 'block text-gray-700 text-xs font-medium dark:text-gray-300';
        conditionLabel.textContent = 'Condição:';
        container.appendChild(conditionLabel);
        
        const conditionInput = document.createElement('input');
        conditionInput.type = 'text';
        conditionInput.className = 'w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        conditionInput.placeholder = 'ex: idade > 18';
        if (item.value && typeof item.value === 'object' && item.value.condition) {
            conditionInput.value = item.value.condition;
        } else if (typeof item.value === 'string' && item.value.includes('?')) {
            // Handle legacy format
            const questionIndex = item.value.indexOf('?');
            conditionInput.value = item.value.substring(0, questionIndex).trim();
        }
        container.appendChild(conditionInput);
        
        // True value field
        const trueLabel = document.createElement('label');
        trueLabel.className = 'block text-gray-700 text-xs font-medium dark:text-gray-300 mt-2';
        trueLabel.textContent = 'Valor se Verdadeiro:';
        container.appendChild(trueLabel);
        
        const trueInput = document.createElement('input');
        trueInput.type = 'text';
        trueInput.className = 'w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        trueInput.placeholder = 'ex: "adulto"';
        if (item.value && typeof item.value === 'object' && item.value.trueValue) {
            trueInput.value = item.value.trueValue;
        } else if (typeof item.value === 'string' && item.value.includes('?')) {
            // Handle legacy format
            const questionIndex = item.value.indexOf('?');
            const colonIndex = item.value.lastIndexOf(':');
            if (questionIndex !== -1 && colonIndex !== -1 && questionIndex < colonIndex) {
                trueInput.value = item.value.substring(questionIndex + 1, colonIndex).trim();
            }
        }
        container.appendChild(trueInput);
        
        // False value field
        const falseLabel = document.createElement('label');
        falseLabel.className = 'block text-gray-700 text-xs font-medium dark:text-gray-300 mt-2';
        falseLabel.textContent = 'Valor se Falso:';
        container.appendChild(falseLabel);
        
        const falseInput = document.createElement('input');
        falseInput.type = 'text';
        falseInput.className = 'w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
        falseInput.placeholder = 'ex: "menor"';
        if (item.value && typeof item.value === 'object' && item.value.falseValue) {
            falseInput.value = item.value.falseValue;
        } else if (typeof item.value === 'string' && item.value.includes(':')) {
            // Handle legacy format
            const colonIndex = item.value.lastIndexOf(':');
            if (colonIndex !== -1) {
                falseInput.value = item.value.substring(colonIndex + 1).trim();
            }
        }
        container.appendChild(falseInput);
        
        // Show computed value if available
        if (item.computedValue !== undefined) {
            const valueSpan = document.createElement('div');
            valueSpan.className = 'text-purple-600 font-mono text-sm mt-2';
            let displayValue = item.computedValue;
            if (typeof item.computedValue === 'boolean') {
                displayValue = item.computedValue ? '@1' : '@0';
            }
            valueSpan.textContent = `Resultado: ${displayValue}`;
            container.appendChild(valueSpan);
        }
        
        // Create a wrapper that will be used by handleUpdate
        const updateWrapper = {
            querySelector: (selector) => {
                if (selector === 'input[name="condition"]') return conditionInput;
                if (selector === 'input[name="trueValue"]') return trueInput;
                if (selector === 'input[name="falseValue"]') return falseInput;
                return null;
            }
        };
        
        // Add event listeners to all inputs
        [conditionInput, trueInput, falseInput].forEach(input => {
            input.addEventListener('input', () => handleUpdate(updateWrapper));
            input.addEventListener('click', (e) => e.stopPropagation());
        });
        
        mainContent.appendChild(container);
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