export default  {
    name: 'boolean',
    rótulo: 'Lógico',
    ícone: 'boolean',
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
};
