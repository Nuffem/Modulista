const typeDefinition = {
    name: 'boolean',
    rótulo: 'Lógico',
    ícone: 'boolean',
    valueType: 'boolean', // This item type produces boolean values
    createEditControl: (item) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = 'item-value';
        checkbox.name = 'value';
        checkbox.className = 'form-checkbox h-5 w-5 text-blue-600';
        if (item.value) {
            checkbox.checked = true;
        }
        return checkbox;
    },
    parseValue: (editControl) => {
        return editControl.checked;
    },
    formatValueForDisplay: (item) => {
        return item.value ? '@1' : '@0';
    },
    createListView: (mainContent, item, handleUpdate) => {
        mainContent.className = 'flex items-center justify-between w-full';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-semibold';
        nameSpan.textContent = item.name;
        mainContent.appendChild(nameSpan);

        const valueControl = typeDefinition.createEditControl(item);
        valueControl.classList.add('w-32');
        mainContent.appendChild(valueControl);

        const eventType = valueControl.type === 'checkbox' ? 'change' : 'input';
        valueControl.addEventListener(eventType, () => handleUpdate(valueControl));
        valueControl.addEventListener('click', (e) => e.stopPropagation());

        mainContent.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                valueControl.checked = !valueControl.checked;
                const changeEvent = new Event('change', { bubbles: true });
                valueControl.dispatchEvent(changeEvent);
            }
        });
    }
};

export default typeDefinition;
