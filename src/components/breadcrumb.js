import { loadIcon } from '../icon-loader.js';

export async function createBreadcrumb() {
    const parts = location.hash.split('/').slice(1).filter(p => p);
    let cumulativePath = '#/';

    const container = document.createElement('div');
    container.className = 'flex items-center';

    const homeButton = document.createElement('button');
    homeButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded';
    homeButton.innerHTML = await loadIcon('inicio', { size: 'w-5 h-5' });
    homeButton.onclick = () => location.hash = '/';
    container.appendChild(homeButton);

    parts.forEach(part => {
        cumulativePath += `${part}/`;

        const separator = document.createElement('span');
        separator.className = 'text-gray-500 mx-2';
        separator.textContent = '>';
        container.appendChild(separator);

        const partButton = document.createElement('button');
        partButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded';
        partButton.textContent = decodeURIComponent(part);
        partButton.onclick = () => location.hash = cumulativePath;
        container.appendChild(partButton);
    });

    return container;
}