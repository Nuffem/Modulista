const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

export const NumberType = {
    name: 'number',
    label: 'Número',
    icon: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <text x="12" y="16" font-family="monospace" font-size="8" fill="currentColor" text-anchor="middle">123</text>
</svg>`,
    renderEditControl: (item) => {
        const isOperation = typeof item.value === 'object' && item.value !== null;
        const operator = isOperation ? item.value.operator : 'constant';
        const operands = isOperation ? item.value.operands : [item.value, 0];

        const operatorLabels = {
            'constant': 'Constante', 'sum': 'Soma', 'subtraction': 'Subtração',
            'multiplication': 'Multiplicação', 'division': 'Divisão'
        };
        const operatorOptionsHTML = Object.entries(operatorLabels)
            .map(([value, label]) => `<option value="${value}" ${value === operator ? 'selected' : ''}>${label}</option>`)
            .join('');

        return `
            <div id="number-operation-container">
                <select id="number-operator" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 mb-2">
                    ${operatorOptionsHTML}
                </select>
                <div id="number-operands"></div>
            </div>`;
    },
    parseValue: (form) => {
        const operator = form.querySelector('#number-operator').value;
        if (operator === 'constant') {
            return Number(form.querySelector('[name="value"]').value);
        } else {
            const operand1 = Number(form.querySelector('[name="operand1"]').value);
            const operand2 = Number(form.querySelector('[name="operand2"]').value);
            return { operator, operands: [operand1, operand2] };
        }
    },
    formatValueForDisplay: (item) => {
        if (typeof item.value === 'object' && item.value !== null) {
            const { operator, operands } = item.value;
            if (!operands || operands.length !== 2) return 'Invalid operands';

            const opMap = { sum: '+', subtraction: '-', multiplication: '*', division: '/' };
            const opSymbol = opMap[operator];
            if (!opSymbol) return 'Invalid operator';

            const [op1, op2] = operands;
            let result;
            switch (operator) {
                case 'sum': result = op1 + op2; break;
                case 'subtraction': result = op1 - op2; break;
                case 'multiplication': result = op1 * op2; break;
                case 'division': result = op2 !== 0 ? op1 / op2 : 'Infinity'; break;
                default: result = NaN;
            }
            const formattedResult = (typeof result === 'number' && !Number.isInteger(result)) ? result.toFixed(2) : result;
            return `${op1} ${opSymbol} ${op2} = ${formattedResult}`;
        }
        return item.value;
    },
};
