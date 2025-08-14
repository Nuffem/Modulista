import { loadIcon } from '../icon-loader.js';

export async function createBreadcrumb(path, itemName = null) {
    const parts = path.split('/').filter(p => p);
    let cumulativePath = '#/';

    const container = document.createElement('div');
    container.className = 'flex items-center';

    const homeButton = document.createElement('button');
    homeButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded';
    homeButton.innerHTML = await loadIcon('home', { size: 'w-5 h-5' });
    homeButton.onclick = () => location.hash = '/';
    container.appendChild(homeButton);

    parts.forEach(part => {
        cumulativePath += `${part}/`;

        const separator = document.createElement('span');
        separator.className = 'text-gray-500 mx-2';
        separator.textContent = '/';
        container.appendChild(separator);

        const partButton = document.createElement('button');
        partButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded';
        partButton.textContent = decodeURIComponent(part);
        partButton.onclick = () => location.hash = cumulativePath;
        container.appendChild(partButton);
    });

    if (itemName) {
        const separator = document.createElement('span');
        separator.className = 'text-gray-500 mx-2';
        separator.textContent = '/';
        container.appendChild(separator);

        const itemButton = document.createElement('button');
        itemButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded';
        itemButton.textContent = itemName;
        itemButton.onclick = () => location.hash = `${cumulativePath}${itemName}`;
        container.appendChild(itemButton);
    }

    return container;
}