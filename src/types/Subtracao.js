const typeDefinition = {
    name: 'subtracao',
    rótulo: 'Subtração',
    ícone: 'x',
    navegavelEmLista: true,
    createEditControl: (item) => {
        const p = document.createElement('p');
        p.className = 'text-gray-500';
        p.textContent = 'Este tipo de item não possui um valor editável.';
        return p;
    },
    parseValue: (editControl, item) => {
        return item.value; // No value to parse from form
    },
    formatValueForDisplay: (item) => {
        return ''; // No value to display
    },
    createListView: (mainContent, item, handleUpdate) => {
        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-semibold';
        nameSpan.textContent = item.name;
        mainContent.appendChild(nameSpan);
    }
};

export default typeDefinition;
