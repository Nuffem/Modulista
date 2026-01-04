export const app = document.getElementById('app');
export const pickerView = document.getElementById('pickerView');
export const mainView = document.getElementById('mainView');
export const openBtn = document.getElementById('openBtn');
export const closeFolderBtn = document.getElementById('closeFolderBtn');
export const treeContainer = document.getElementById('treeContainer');
export const contentArea = document.getElementById('contentArea');
export const contentTitle = document.getElementById('contentTitle');
export const renameBtn = document.getElementById('renameBtn');
export const commands = document.getElementById('commands');
export const moveBtn = document.getElementById('moveBtn');
export const restoreModal = document.getElementById('restoreModal');
export const restoreBtn = document.getElementById('restoreBtn');
export const openNewBtn = document.getElementById('openNewBtn');

// UI helpers para coluna de comandos
export function createCommandProgress(){
	if(!commands) return null;
	const cmdItem = document.createElement('div');
	cmdItem.className = 'p-2 bg-slate-50 dark:bg-slate-700 rounded shadow flex flex-col space-y-2';
	const label = document.createElement('div');
	label.className = 'text-sm text-slate-700 dark:text-slate-100 flex flex-col gap-1';
	const topRow = document.createElement('div');
	topRow.className = 'flex items-center gap-2';
	topRow.innerHTML = '<span class="material-symbols-outlined mr-2">smart_toy</span><span class="webllm-status-text">Sugerindo com IA...</span>';
	const modelField = document.createElement('div');
	modelField.className = 'webllm-model-name text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-full truncate';
	modelField.textContent = window.__webllm_model_name || '';
	label.appendChild(topRow);
	label.appendChild(modelField);
	const progressOuter = document.createElement('div');
	progressOuter.className = 'w-full bg-slate-200 dark:bg-slate-600 rounded h-3 overflow-hidden';
	const progressInner = document.createElement('div');
	progressInner.className = 'bg-indigo-500 h-3';
	progressInner.style.width = '0%';
	progressInner.style.transition = 'width 200ms linear';
	progressOuter.appendChild(progressInner);
	cmdItem.appendChild(label);
	cmdItem.appendChild(progressOuter);
	commands.appendChild(cmdItem);
	try{ window.__webllm_progress_element = progressInner; window.__webllm_progress_label = label; }catch(_){ }
	return { container: cmdItem, label, progressInner, remove: ()=>{ try{ cmdItem.remove(); }catch(_){ } } };
}

export function appendCommandDetail(systemMsg, userMsg, temperature, max_tokens){
	if(!commands) return null;
	const detailItem = document.createElement('div');
	detailItem.className = 'p-2 bg-slate-50 dark:bg-slate-700 rounded shadow text-sm text-slate-700 dark:text-slate-100';
	const header = document.createElement('div');
	header.className = 'flex items-center gap-2 mb-1';
	header.innerHTML = '<span class="material-symbols-outlined mr-2">description</span><strong>Detalhes da solicitação</strong>';

	const form = document.createElement('div');
	form.className = 'grid grid-cols-1 gap-2';

	const makeRow = (labelText, el) => {
		const wrap = document.createElement('div');
		wrap.className = 'flex flex-col';
		const lbl = document.createElement('label');
		lbl.className = 'text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1';
		lbl.textContent = labelText;
		wrap.appendChild(lbl);
		wrap.appendChild(el);
		return wrap;
	};

	const tempInput = document.createElement('input');
	tempInput.className = 'text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 w-full';
	tempInput.type = 'text';
	tempInput.value = String(temperature);
	tempInput.readOnly = true;

	const maxInput = document.createElement('input');
	maxInput.className = tempInput.className;
	maxInput.type = 'text';
	maxInput.value = String(max_tokens);
	maxInput.readOnly = true;

	const systemTextarea = document.createElement('textarea');
	systemTextarea.className = 'whitespace-pre-wrap text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto';
	systemTextarea.rows = 3;
	systemTextarea.readOnly = true;

	const userTextarea = document.createElement('textarea');
	userTextarea.className = systemTextarea.className;
	userTextarea.rows = 3;
	userTextarea.readOnly = true;

	systemTextarea.value = systemMsg || '(sem mensagem)';
	userTextarea.value = userMsg || '(sem mensagem)';

	form.appendChild(makeRow('temperature', tempInput));
	form.appendChild(makeRow('max_tokens', maxInput));
	form.appendChild(makeRow('Mensagem do sistema', systemTextarea));
	form.appendChild(makeRow('Mensagem do usuário', userTextarea));

	detailItem.appendChild(header);
	detailItem.appendChild(form);
	commands.appendChild(detailItem);
	return detailItem;
}

export function appendCommandResult(text){
	if(!commands) return null;
	const resultItem = document.createElement('div');
	resultItem.className = 'p-2 bg-slate-50 dark:bg-slate-700 rounded shadow text-sm text-slate-700 dark:text-slate-100';
	const header = document.createElement('div');
	header.className = 'flex items-center gap-2 mb-1';
	header.innerHTML = '<span class="material-symbols-outlined mr-2">smart_toy</span><strong>Resposta</strong>';
	const body = document.createElement('div');
	body.className = 'whitespace-pre-wrap text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto';
	body.style.maxHeight = '6rem';
	body.textContent = (text || '');
	resultItem.appendChild(header);
	resultItem.appendChild(body);
	commands.appendChild(resultItem);
	return resultItem;
}
