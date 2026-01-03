import { commands } from '../ui.js';
import { getSelected, setSelected, ensureHandlePermission, getRootHandle } from '../state.js';
import { attachSuggestHandler } from '../suggestions.js';
import { copyDirectory, getDirByPath } from '../commands.js';

export async function moveSelected(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent){
    alert('Mover a raiz não é suportado.');
    return false;
  }

  const prev = document.getElementById('move-form');
  if(prev) prev.remove();

  const form = document.createElement('div');
  form.id = 'move-form';
  form.className = 'mt-2 flex items-center space-x-2';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Destino (ex: /pasta/receber)';
  input.className = 'border rounded p-1 flex-1 bg-white text-slate-900 placeholder-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'p-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400';
  confirmBtn.setAttribute('title', 'Confirmar');
  confirmBtn.setAttribute('aria-label', 'Confirmar');
  confirmBtn.innerHTML = '<span class="material-symbols-outlined">check</span>';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'p-2 bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400';
  cancelBtn.setAttribute('title', 'Cancelar');
  cancelBtn.setAttribute('aria-label', 'Cancelar');
  cancelBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';

  const suggestBtn = document.createElement('button');
  suggestBtn.type = 'button';
  suggestBtn.className = 'p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400';
  suggestBtn.setAttribute('title', 'Sugerir com IA');
  suggestBtn.setAttribute('aria-label', 'Sugerir com IA');
  suggestBtn.innerHTML = '<span class="material-symbols-outlined">smart_toy</span>';

  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.className = 'p-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400';
  upBtn.setAttribute('title', 'Um nível acima');
  upBtn.setAttribute('aria-label', 'Um nível acima');
  upBtn.innerHTML = '<span class="material-symbols-outlined">arrow_upward</span>';

  form.appendChild(input);
  form.appendChild(upBtn);
  form.appendChild(suggestBtn);
  form.appendChild(confirmBtn);
  form.appendChild(cancelBtn);

  if(commands) commands.appendChild(form);
  input.focus();

  const cleanup = ()=>{ const el = document.getElementById('move-form'); if(el) el.remove(); };

  cancelBtn.addEventListener('click', ()=>{ cleanup(); });
  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') confirmBtn.click(); if(e.key === 'Escape') cleanup(); });

  upBtn.addEventListener('click', ()=>{
    try{
      const path = (selected && selected.path) ? selected.path : '/';
      const parts = path.split('/').filter(Boolean);
      if(parts.length <= 1){
        input.value = '/';
      } else {
        const newParts = parts.slice(0, Math.max(0, parts.length - 2));
        input.value = newParts.length ? ('/' + newParts.join('/')) : '/';
      }
      input.focus();
    }catch(_){ input.value = '/'; }
  });

  confirmBtn.addEventListener('click', async ()=>{
    const destPath = (input.value || '').trim();
    if(!destPath){ alert('Informe o destino.'); return; }
    try{
      const root = getRootHandle();
      if(!root) return alert('Nenhuma pasta aberta.');
      const targetDir = await getDirByPath(root, destPath);
      if(!targetDir) return alert('Pasta de destino não encontrada: ' + destPath);
      const okPerm = await ensureHandlePermission(targetDir, 'readwrite').catch(()=>false);
      if(!okPerm) return alert('Permissão negada para a pasta de destino.');

      if(selected.kind === 'file'){
        const oldHandle = selected.handle;
        const file = await oldHandle.getFile();
        const newHandle = await targetDir.getFileHandle(selected.name, {create:true});
        const writable = await newHandle.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
        await selected.parent.removeEntry(selected.name);
      } else {
        const source = await selected.parent.getDirectoryHandle(selected.name);
        const tgt = await targetDir.getDirectoryHandle(selected.name, {create:true});
        await copyDirectory(source, tgt);
        await selected.parent.removeEntry(selected.name, {recursive: true});
      }

      setSelected(null);
      cleanup();
      return true;
    }catch(e){
      alert('Falha ao mover: ' + (e && e.message));
      return false;
    }
  });

  attachSuggestHandler(suggestBtn, selected, input, 'move');

  return true;
}
