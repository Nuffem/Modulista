const typeDefinition = {
    name: 'list',
    rótulo: 'Lista',
    ícone: 'list-square',
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
        mainContent.className = 'flex items-center justify-between w-full';
        const itemUrl = `#${item.path}${item.name}/`;

        const a = document.createElement('a');
        a.href = itemUrl;
        a.className = 'flex items-center grow';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-semibold';
        nameSpan.textContent = item.name;
        a.appendChild(nameSpan);

        mainContent.appendChild(a);
    }
};

export default typeDefinition;
