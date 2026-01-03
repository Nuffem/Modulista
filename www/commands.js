import { commands } from './ui.js';
import { getSelected, setSelected, ensureHandlePermission, getRootHandle } from './state.js';
import { attachSuggestHandler } from './suggestions.js';

export async function copyDirectory(sourceDir, targetDir){
  for await (const [name, handle] of sourceDir.entries()){
    if(handle.kind === 'file'){
      const f = await handle.getFile();
      const newF = await targetDir.getFileHandle(name, {create:true});
      const w = await newF.createWritable();
      await w.write(await f.arrayBuffer());
      await w.close();
    } else {
      const srcSub = await sourceDir.getDirectoryHandle(name);
      const tgtSub = await targetDir.getDirectoryHandle(name, {create:true});
      await copyDirectory(srcSub, tgtSub);
    }
  }
}

export async function renameSelected(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent){
    alert('Renomear a raiz não é suportado.');
    return false;
  }

  // Remover formulário anterior, se existir
  const prev = document.getElementById('rename-form');
  if(prev) prev.remove();

  const form = document.createElement('div');
  form.id = 'rename-form';
  form.className = 'mt-2 flex items-center space-x-2';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = selected.name;
  input.placeholder = 'Novo nome';
  input.className = 'border rounded p-1 flex-1 bg-white text-slate-900 placeholder-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400';

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

  form.appendChild(input);
  form.appendChild(suggestBtn);
  form.appendChild(confirmBtn);
  form.appendChild(cancelBtn);

  // Inserir na coluna de comandos
  if(commands) commands.appendChild(form);
  input.focus();
  input.select();

  const cleanup = ()=>{
    const el = document.getElementById('rename-form');
    if(el) el.remove();
  };

  cancelBtn.addEventListener('click', ()=>{
    cleanup();
  });

  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') confirmBtn.click();
    if(e.key === 'Escape') cleanup();
  });

  // generateSuggestion moved to ./suggestions.js

  confirmBtn.addEventListener('click', async ()=>{
    const newName = (input.value || '').trim();
    if(!newName || newName === selected.name){ cleanup(); return false; }
    try{
      if(selected.kind === 'file'){
        const oldHandle = selected.handle;
        const file = await oldHandle.getFile();
        const newHandle = await selected.parent.getFileHandle(newName, {create: true});
        const writable = await newHandle.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
        await selected.parent.removeEntry(selected.name);
      } else {
        const source = await selected.parent.getDirectoryHandle(selected.name);
        const target = await selected.parent.getDirectoryHandle(newName, {create:true});
        await copyDirectory(source, target);
        await selected.parent.removeEntry(selected.name, {recursive: true});
      }
      setSelected(null);
      cleanup();
      return true;
    }catch(e){
      alert('Falha ao renomear: ' + (e && e.message));
      return false;
    }
  });

  // Attach suggestion handler from suggestions.js
  attachSuggestHandler(suggestBtn, selected, input);
  return true;
}

  export async function moveSelected(){
    const selected = getSelected();
    if(!selected) return alert('Nenhum item selecionado');
    if(!selected.parent){
      alert('Mover a raiz não é suportado.');
      return false;
    }

    // Remove previous form if exists
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

    form.appendChild(input);
    form.appendChild(confirmBtn);
    form.appendChild(cancelBtn);

    if(commands) commands.appendChild(form);
    input.focus();

    const cleanup = ()=>{ const el = document.getElementById('move-form'); if(el) el.remove(); };

    cancelBtn.addEventListener('click', ()=>{ cleanup(); });
    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') confirmBtn.click(); if(e.key === 'Escape') cleanup(); });

    async function getDirByPath(rootHandle, path){
      if(!path) return null;
      if(path === '/' || path === '') return rootHandle;
      const p = path.startsWith('/') ? path.slice(1) : path;
      const parts = p.split('/').filter(Boolean);
      let cur = rootHandle;
      for(const part of parts){
        try{
          cur = await cur.getDirectoryHandle(part);
        }catch(e){
          return null; // not found
        }
      }
      return cur;
    }

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

    return true;
  }
