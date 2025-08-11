import { loadIcon } from '../icon-loader.js';

export async function renderBreadcrumb(path, itemName = null) {
    const breadcrumbEl = document.getElementById('breadcrumb');
    const parts = path.split('/').filter(p => p);
    let cumulativePath = '#/';
    let html = '<div class="flex items-center">';
    html += `<button onclick="location.hash='/'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${await loadIcon('home', { size: 'w-5 h-5' })}</button>`;
    parts.forEach((part, index) => {
        cumulativePath += `${part}/`;
        html += ` <span class="text-gray-500 mx-2">/</span> <button onclick="location.hash='${cumulativePath}'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${decodeURIComponent(part)}</button>`;
    });
    if (itemName) {
        html += ` <span class="text-gray-500 mx-2">/</span> <span class="font-semibold">${itemName}</span>`;
    }
    html += '</div>';
    breadcrumbEl.innerHTML = html;
}