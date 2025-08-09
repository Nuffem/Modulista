import { initDB, getItems, addItem, getItem, updateItem, deleteItem } from './db.js';

const appContent = document.getElementById('app-content');
const breadcrumbEl = document.getElementById('breadcrumb');

// --- Rendering Functions ---

function renderBreadcrumb(path) {
    const parts = path.split('/').filter(p => p);
    let cumulativePath = '#/';
    let html = '<div class="flex items-center">';
    html += `<button onclick="location.hash='/'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg></button>`;
    parts.forEach((part, index) => {
        cumulativePath += `${part}/`;
        html += ` <span class="text-gray-500 mx-2">/</span> <button onclick="location.hash='${cumulativePath}'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${decodeURIComponent(part)}</button>`;
    });
    html += '</div>';
    breadcrumbEl.innerHTML = html;
}

function getItemIcon(type) {
    const iconColor = "text-gray-500";
    const iconSize = "w-6 h-6";
    switch (type) {
        case 'list':
            return `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="${iconSize} ${iconColor}"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>`;
        case 'text':
            return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <text x="12" y="16" font-family="monospace" font-size="8" fill="currentColor" text-anchor="middle">abc</text>
</svg>`;
        case 'number':
            return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <text x="12" y="16" font-family="monospace" font-size="8" fill="currentColor" text-anchor="middle">123</text>
</svg>`;
        case 'boolean':
            return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="${iconSize} ${iconColor}" fill="none" stroke="currentColor" stroke-width="1.5">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" fill="none"/>
  <path d="M12 3v18" stroke="currentColor"/>
  <path d="M15 9l3 3-4 4" stroke-width="2" stroke="currentColor" fill="none"/>
</svg>`;
        default:
            return '';
    }
}

async function renderListView(path) {
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path = path + '/';
    appContent.innerHTML = `<p class="text-gray-500">Carregando...</p>`;
    breadcrumbEl.style.display = 'block';
    renderBreadcrumb(path);
    try {
        const items = await getItems(path);

        let listHTML = items.length === 0
            ? ''
            : '<div class="space-y-3">' + items.map(item => {
                const editUrl = `#/edit/${item.id}`;
                const listUrl = `#${path}${item.name}/`;
                const itemUrl = item.type === 'list' ? listUrl : editUrl;
                return `
                    <a href="${itemUrl}" class="block p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="mr-4">${getItemIcon(item.type)}</div>
                                <span class="font-semibold">${item.name}</span>
                            </div>
                            ${item.type === 'boolean'
                                ? `<input type="checkbox" ${item.value ? 'checked' : ''} disabled class="form-checkbox h-5 w-5 text-blue-600">`
                                : item.type === 'list'
                                ? `<span class="text-sm text-gray-500"></span>`
                                : `<span class="text-gray-700">${item.value}</span>`
                            }
                        </div>
                    </a>`;
            }).join('') + '</div>';

        const addButtonHTML = `
            <button onclick="location.hash = '${path}add'" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>
        `;
        appContent.innerHTML = listHTML + addButtonHTML;

    } catch (error) {
        console.error('Failed to render list view:', error);
        appContent.innerHTML = `<p class="text-red-500">Erro ao carregar os itens.</p>`;
    }
}

function renderAddItemView(path) {
    breadcrumbEl.style.display = 'none';
    appContent.innerHTML = `
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h2 class="text-xl font-bold mb-4">Adicionar Novo Item</h2>
            <form id="add-item-form">
                <div class="mb-4"><label for="item-name" class="block text-gray-700 text-sm font-bold mb-2">Nome</label><input type="text" id="item-name" name="name" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required></div>
                <div class="mb-4"><label for="item-type" class="block text-gray-700 text-sm font-bold mb-2">Tipo</label><select id="item-type" name="type" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"><option value="text">Texto</option><option value="number">Número</option><option value="boolean">Lógico (Sim/Não)</option><option value="list">Pasta</option></select></div>
                <div id="value-container" class="mb-4"><label for="item-value" id="item-value-label" class="block text-gray-700 text-sm font-bold mb-2">Valor</label><div id="item-value-input"><input type="text" id="item-value" name="value" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"></div></div>
                <div class="flex items-center justify-between"><button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar</button><button type="button" onclick="history.back()" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Cancelar</button></div>
            </form>
        </div>`;
    const typeSelect = document.getElementById('item-type'), valueContainer = document.getElementById('value-container'), valueInputDiv = document.getElementById('item-value-input');
    typeSelect.addEventListener('change', (e) => {
        const type = e.target.value;
        if (type === 'list') valueContainer.style.display = 'none';
        else if (type === 'boolean') { valueContainer.style.display = 'block'; valueInputDiv.innerHTML = `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600">`; }
        else { valueContainer.style.display = 'block'; valueInputDiv.innerHTML = `<input type="${type === 'number' ? 'number' : 'text'}" id="item-value" name="value" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">`; }
    });
    document.getElementById('add-item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target, type = form.type.value, valueEl = form.querySelector('[name="value"]');
        const newItem = { path, name: form.name.value, type, value: type === 'list' ? '' : (type === 'boolean' ? valueEl.checked : valueEl.value) };
        try { await addItem(newItem); location.hash = path; } catch (error) { console.error('Failed to add item:', error); alert('Erro ao salvar o item.'); }
    });
}

async function renderEditItemView(itemId) {
    breadcrumbEl.style.display = 'none';
    appContent.innerHTML = `<p class="text-gray-500">Carregando item...</p>`;
    try {
        const item = await getItem(itemId);
        if (!item) { appContent.innerHTML = `<p class="text-red-500">Item não encontrado.</p>`; return; }

        let valueInputHTML;
        if (item.type === 'boolean') {
            valueInputHTML = `<input type="checkbox" id="item-value" name="value" class="form-checkbox h-5 w-5 text-blue-600" ${item.value ? 'checked' : ''}>`;
        } else {
            valueInputHTML = `<input type="${item.type === 'number' ? 'number' : 'text'}" id="item-value" name="value" value="${item.value}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">`;
        }

        appContent.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h2 class="text-xl font-bold mb-4">Editar Item</h2>
                <form id="edit-item-form">
                    <div class="mb-4"><label class="block text-gray-700 text-sm font-bold mb-2">Tipo</label><p class="text-gray-800">${item.type}</p></div>
                    <div class="mb-4"><label for="item-name" class="block text-gray-700 text-sm font-bold mb-2">Nome</label><input type="text" id="item-name" name="name" value="${item.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required></div>
                    <div id="value-container" class="mb-4"><label for="item-value" class="block text-gray-700 text-sm font-bold mb-2">Valor</label>${valueInputHTML}</div>
                    <div class="flex items-center justify-between">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Salvar Alterações</button>
                        <button type="button" onclick="history.back()" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancelar</button>
                    </div>
                </form>
                <div class="mt-6 border-t pt-4">
                    <button id="delete-item-btn" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full">Excluir Item</button>
                </div>
            </div>`;

        document.getElementById('edit-item-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target, valueEl = form.querySelector('[name="value"]');
            const updatedItem = { ...item, name: form.name.value, value: item.type === 'boolean' ? valueEl.checked : valueEl.value };
            try { await updateItem(updatedItem); location.hash = item.path; } catch (error) { console.error('Failed to update item:', error); alert('Erro ao atualizar o item.'); }
        });

        document.getElementById('delete-item-btn').addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.')) {
                try { await deleteItem(itemId); location.hash = item.path; } catch (error) { console.error('Failed to delete item:', error); alert('Erro ao excluir o item.'); }
            }
        });

    } catch (error) {
        console.error('Failed to render edit view:', error);
        appContent.innerHTML = `<p class="text-red-500">Erro ao carregar o item para edição.</p>`;
    }
}

// --- Router ---
function router() {
    const hash = window.location.hash.substring(1) || '/';
    if (hash.startsWith('/edit/')) {
        const itemId = hash.substring('/edit/'.length);
        renderEditItemView(itemId);
    } else if (hash.endsWith('/add')) {
        const path = hash.substring(0, hash.length - 'add'.length) || '/';
        renderAddItemView(path);
    } else {
        renderListView(hash);
    }
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initDB().then(() => {
        console.log('Database ready.');
        window.addEventListener('hashchange', router);
        router();
    }).catch(err => {
        console.error('Failed to initialize database:', err);
        appContent.innerHTML = `<p class="text-red-500">Error: Could not initialize the database.</p>`;
    });
});
