import { loadIcon } from '../icon-loader.js';
import { parse, stringify, executePlan } from '../custom-parser.js';
import { getItems } from '../db.js';
import { syncItems } from './sync.js';

export async function displayTextContent(path, items, containerId = 'text-content') {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'bg-white p-4 rounded-lg shadow dark:bg-gray-800';

    // Display view
    const textDisplay = document.createElement('div');
    textDisplay.id = `text-display-${containerId}`;

    const pre = document.createElement('pre');
    pre.className = 'bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200';
    const codeBlock = document.createElement('code');
    codeBlock.textContent = 'Carregando...';
    pre.appendChild(codeBlock);
    textDisplay.appendChild(pre);

    const displayButtons = document.createElement('div');
    displayButtons.className = 'mt-4 flex justify-end space-x-2';
    
    const loadBtn = document.createElement('button');
    loadBtn.id = `load-from-device-btn-${containerId}`;
    loadBtn.title = 'Carregar do dispositivo';
    loadBtn.className = 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700';
    loadBtn.innerHTML = await loadIcon('upload', { size: 'w-6 h-6' });
    displayButtons.appendChild(loadBtn);

    const saveBtn = document.createElement('button');
    saveBtn.id = `save-to-device-btn-${containerId}`;
    saveBtn.title = 'Salvar no dispositivo';
    saveBtn.className = 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700';
    saveBtn.innerHTML = await loadIcon('download', { size: 'w-6 h-6' });
    displayButtons.appendChild(saveBtn);

    const editBtn = document.createElement('button');
    editBtn.id = `edit-text-btn-${containerId}`;
    editBtn.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700';
    editBtn.innerHTML = await loadIcon('pencil', { size: 'w-6 h-6' });
    displayButtons.appendChild(editBtn);
    textDisplay.appendChild(displayButtons);

    // Edit view
    const textEdit = document.createElement('div');
    textEdit.id = `text-edit-${containerId}`;
    textEdit.className = 'hidden';

    const textEditor = document.createElement('textarea');
    textEditor.id = `text-editor-${containerId}`;
    textEditor.className = 'w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200';
    textEdit.appendChild(textEditor);

    const editButtons = document.createElement('div');
    editButtons.className = 'mt-4 flex justify-end space-x-2';

    const saveEditBtn = document.createElement('button');
    saveEditBtn.id = `save-text-btn-${containerId}`;
    saveEditBtn.className = 'bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700';
    saveEditBtn.innerHTML = await loadIcon('check', { size: 'w-6 h-6' });
    editButtons.appendChild(saveEditBtn);

    const cancelEditBtn = document.createElement('button');
    cancelEditBtn.id = `cancel-text-btn-${containerId}`;
    cancelEditBtn.className = 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700';
    cancelEditBtn.innerHTML = await loadIcon('x', { size: 'w-6 h-6' });
    editButtons.appendChild(cancelEditBtn);
    textEdit.appendChild(editButtons);

    wrapper.appendChild(textDisplay);
    wrapper.appendChild(textEdit);
    container.appendChild(wrapper);

    let textContent = '';
    const plan = stringify(items, path);
    executePlan(plan, getItems).then(str => {
        textContent = str;
        codeBlock.textContent = textContent;
    }).catch(error => {
        codeBlock.textContent = `Erro ao gerar o texto: ${error.message}`;
        console.error("Stringify error:", error);
    });

    loadBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,text/plain';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                const fileContent = event.target.result;
                textEditor.value = fileContent;
                textContent = fileContent;
                textDisplay.classList.add('hidden');
                textEdit.classList.remove('hidden');
            };
            reader.onerror = event => {
                console.error("File could not be read!", event);
                alert("Erro ao ler o arquivo.");
            };
            reader.readAsText(file);
        };
        input.click();
    });

    saveBtn.addEventListener('click', () => {
        const text = codeBlock.textContent;
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const pathParts = path.split('/').filter(p => p);
        const fileName = pathParts.length > 0 ? `${pathParts.join('_')}.txt` : 'modulista_root.txt';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });

    editBtn.addEventListener('click', () => {
        textEditor.value = textContent;
        textDisplay.classList.add('hidden');
        textEdit.classList.remove('hidden');
    });

    cancelEditBtn.addEventListener('click', () => {
        textEdit.classList.add('hidden');
        textDisplay.classList.remove('hidden');
    });

    saveEditBtn.addEventListener('click', async () => {
        const newText = textEditor.value;
        try {
            const newItemsObject = parse(newText);
            await syncItems(path, newItemsObject);
            const { setCurrentView } = await import('../app.js');
            const { displayListView } = await import('./list-view.js');
            setCurrentView('list');
            await displayListView(path);
        } catch (error) {
            console.error('Failed to parse and update items:', error);
            alert('Erro ao salvar. Verifique a sintaxe.\n' + error.message);
        }
    });
}