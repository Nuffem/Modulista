import { loadIcon } from '../icon-loader.js';
import { parse, stringify } from '../custom-parser.js';
import { getItems } from '../db.js';
import { syncItems } from './sync.js';

export async function renderTextContent(path, items, containerId = 'text-content') {
    const container = document.getElementById(containerId);
    
    const textContentHTML = `
        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
            <div id="text-display-${containerId}">
                <pre class="bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200"><code>Carregando...</code></pre>
                <div class="mt-4 flex justify-end space-x-2">
                    <button id="load-from-device-btn-${containerId}" title="Carregar do dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await loadIcon('upload', { size: 'w-6 h-6' })}
                    </button>
                    <button id="save-to-device-btn-${containerId}" title="Salvar no dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await loadIcon('download', { size: 'w-6 h-6' })}
                    </button>
                    <button id="edit-text-btn-${containerId}" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                        ${await loadIcon('pencil', { size: 'w-6 h-6' })}
                    </button>
                </div>
            </div>
            <div id="text-edit-${containerId}" class="hidden">
                <textarea id="text-editor-${containerId}" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"></textarea>
                <div class="mt-4 flex justify-end space-x-2">
                    <button id="save-text-btn-${containerId}" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700">
                        ${await loadIcon('check', { size: 'w-6 h-6' })}
                    </button>
                    <button id="cancel-text-btn-${containerId}" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await loadIcon('x', { size: 'w-6 h-6' })}
                    </button>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = textContentHTML;

    // Yield to the event loop to allow the DOM to update
    await new Promise(resolve => setTimeout(resolve, 0));

    const textDisplay = document.getElementById(`text-display-${containerId}`);
    const textEdit = document.getElementById(`text-edit-${containerId}`);
    const textEditor = document.getElementById(`text-editor-${containerId}`);

    if (!textDisplay) {
        console.error(`Could not find #text-display-${containerId}`);
        return;
    }

    const codeBlock = textDisplay.querySelector('code');

    let textContent = '';

    stringify(items, path, getItems)
        .then(str => {
            textContent = str;
            codeBlock.textContent = textContent;
        })
        .catch(error => {
            const errorMessage = `Erro ao gerar o texto: ${error.message}`;
            codeBlock.textContent = errorMessage;
            console.error("Stringify error:", error);
        });

    document.getElementById(`load-from-device-btn-${containerId}`).addEventListener('click', () => {
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

    document.getElementById(`save-to-device-btn-${containerId}`).addEventListener('click', () => {
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

    document.getElementById(`edit-text-btn-${containerId}`).addEventListener('click', () => {
        textEditor.value = textContent;
        textDisplay.classList.add('hidden');
        textEdit.classList.remove('hidden');
    });

    document.getElementById(`cancel-text-btn-${containerId}`).addEventListener('click', () => {
        textEdit.classList.add('hidden');
        textDisplay.classList.remove('hidden');
    });

    document.getElementById(`save-text-btn-${containerId}`).addEventListener('click', async () => {
        const newText = textEditor.value;
        try {
            const newItemsObject = parse(newText);
            await syncItems(path, newItemsObject);
            // Set currentView to 'list' and re-render
            const { setCurrentView } = await import('../app.js');
            const { renderListView } = await import('./list-view.js');
            setCurrentView('list');
            await renderListView(path);
        } catch (error) {
            console.error('Failed to parse and update items:', error);
            alert('Erro ao salvar. Verifique a sintaxe.\n' + error.message);
        }
    });
}