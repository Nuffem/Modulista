import { commands, createCommandProgress, enterCommandDetailMode, exitCommandDetailMode, moveBtn } from '../ui.js';
import { getSelected, setSelected, ensureHandlePermission, getRootHandle } from '../state.js';
import { generateSuggestion } from '../suggestions.js';
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
  try{ enterCommandDetailMode(moveBtn || document.getElementById('moveBtn')); }catch(_){ }

  const form = document.createElement('div');
  form.id = 'move-form';
  form.className = 'mt-2 flex flex-col space-y-2';

  const makePrimaryBtn = (text)=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'w-full flex items-center justify-start gap-2 px-3 py-2 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100 dark:border-slate-600 border bg-indigo-600 text-white rounded hover:bg-indigo-700';
    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined align-middle text-[18px]';
    icon.setAttribute('aria-hidden','true');
    icon.textContent = '';
    b.appendChild(icon);
    b.appendChild(document.createTextNode(text));
    return b;
  };

  const btnUp = makePrimaryBtn('Um nível acima');
  btnUp.querySelector('span').textContent = 'arrow_upward';
  const btnExisting = makePrimaryBtn('Subpasta existente');
  btnExisting.querySelector('span').textContent = 'folder';
  const btnNew = makePrimaryBtn('Nova subpasta');
  btnNew.querySelector('span').textContent = 'create_new_folder';

  const contentArea = document.createElement('div');
  contentArea.className = 'mt-2';

  form.appendChild(btnUp);
  form.appendChild(btnExisting);
  form.appendChild(btnNew);
  form.appendChild(contentArea);

  if(commands) commands.appendChild(form);

  const cleanup = ()=>{ try{ exitCommandDetailMode(); }catch(_){ const el = document.getElementById('move-form'); if(el) el.remove(); } };

  const performMove = async (selectedItem, targetDir)=>{
    if(!selectedItem) throw new Error('Nenhum item selecionado');
    if(selectedItem.kind === 'file'){
      const oldHandle = selectedItem.handle;
      const file = await oldHandle.getFile();
      const newHandle = await targetDir.getFileHandle(selectedItem.name, {create:true});
      const writable = await newHandle.createWritable();
      await writable.write(await file.arrayBuffer());
      await writable.close();
      await selectedItem.parent.removeEntry(selectedItem.name);
    } else {
      const source = await selectedItem.parent.getDirectoryHandle(selectedItem.name);
      const tgt = await targetDir.getDirectoryHandle(selectedItem.name, {create:true});
      await copyDirectory(source, tgt);
      await selectedItem.parent.removeEntry(selectedItem.name, {recursive: true});
    }
  };

  // Voltar para o menu principal
  const showMain = ()=>{
    contentArea.innerHTML = '';
    btnUp.style.display = '';
    btnExisting.style.display = '';
    btnNew.style.display = '';
    btnExisting.disabled = false; btnExisting.classList.remove('opacity-50','cursor-not-allowed'); btnExisting.removeAttribute('aria-disabled');
    btnNew.disabled = false; btnNew.classList.remove('opacity-50','cursor-not-allowed'); btnNew.removeAttribute('aria-disabled');
  };

  // Um nível acima: move direto para o nível acima do pai
  btnUp.addEventListener('click', async ()=>{
    try{
      const root = getRootHandle();
      if(!root) return alert('Nenhuma pasta aberta.');
      const path = (selected && selected.path) ? selected.path : '/';
      const parts = path.split('/').filter(Boolean);
      let destPath = '/';
      if(parts.length > 1){
        const newParts = parts.slice(0, Math.max(0, parts.length - 2));
        destPath = newParts.length ? ('/' + newParts.join('/')) : '/';
      }
      const targetDir = await getDirByPath(root, destPath);
      if(!targetDir) return alert('Pasta de destino não encontrada: ' + destPath);
      const okPerm = await ensureHandlePermission(targetDir, 'readwrite').catch(()=>false);
      if(!okPerm) return alert('Permissão negada para a pasta de destino.');
      await performMove(selected, targetDir);
      setSelected(null);
      cleanup();
      return true;
    }catch(e){ alert('Falha ao mover: ' + (e && e.message)); return false; }
  });

  // Subpasta existente: mostra lista de subpastas dentro do pai
  btnExisting.addEventListener('click', async ()=>{
    try{
      // ocultar as outras opções e manter apenas este botão (desativado)
      btnUp.style.display = 'none';
      btnNew.style.display = 'none';
      btnExisting.disabled = true; btnExisting.classList.add('opacity-50','cursor-not-allowed'); btnExisting.setAttribute('aria-disabled','true');
      contentArea.innerHTML = '';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'p-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded border border-slate-200 dark:border-slate-600 focus:outline-none';
      back.textContent = 'Voltar';
      contentArea.appendChild(back);

      const list = document.createElement('div');
      list.className = 'mt-2 space-y-1';
      contentArea.appendChild(list);

      back.addEventListener('click', ()=>{ showMain(); });

      if(selected && selected.parent){
        const dirs = [];
        for await (const [name, handle] of selected.parent.entries()){
          try{ if(handle && handle.kind === 'directory') dirs.push(name); }catch(_){ }
          if(dirs.length >= 500) break;
        }
        if(dirs.length === 0){
          const empty = document.createElement('div'); empty.className = 'text-sm text-slate-500'; empty.textContent = 'Nenhuma subpasta encontrada.'; list.appendChild(empty);
        } else {
          for(const name of dirs){
            const itemBtn = document.createElement('button');
            itemBtn.type = 'button';
            itemBtn.className = 'w-full flex items-center justify-start gap-2 px-3 py-2 bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-slate-100 rounded border border-indigo-100 dark:border-slate-600 focus:outline-none hover:bg-indigo-100 dark:hover:bg-slate-600';
            const itemIcon = document.createElement('span');
            itemIcon.className = 'material-symbols-outlined align-middle text-[18px]';
            itemIcon.setAttribute('aria-hidden','true');
            itemIcon.textContent = 'folder';
            itemBtn.appendChild(itemIcon);
            itemBtn.appendChild(document.createTextNode(name));
            itemBtn.addEventListener('click', async ()=>{
              try{
                const targetDir = await selected.parent.getDirectoryHandle(name);
                const okPerm = await ensureHandlePermission(targetDir, 'readwrite').catch(()=>false);
                if(!okPerm) return alert('Permissão negada para a pasta de destino.');
                await performMove(selected, targetDir);
                setSelected(null);
                cleanup();
                return true;
              }catch(e){ alert('Falha ao mover: ' + (e && e.message)); }
            });
            list.appendChild(itemBtn);
          }
        }
      }
    }catch(e){ alert('Erro ao listar subpastas: ' + (e && e.message)); }
  });

  // Nova subpasta: mostra campo de nome + confirmar
  btnNew.addEventListener('click', async ()=>{
    try{
      // ocultar as outras opções e manter apenas este botão (desativado)
      btnUp.style.display = 'none';
      btnExisting.style.display = 'none';
      btnNew.disabled = true; btnNew.classList.add('opacity-50','cursor-not-allowed'); btnNew.setAttribute('aria-disabled','true');
      contentArea.innerHTML = '';
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'p-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded border border-slate-200 dark:border-slate-600 focus:outline-none';
      back.textContent = 'Voltar';
      contentArea.appendChild(back);

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Nome da nova subpasta';
      input.className = 'mt-2 w-full border rounded p-1 bg-white text-slate-900 placeholder-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 focus:outline-none';
      contentArea.appendChild(input);

      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'mt-2 p-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none';
      confirm.textContent = 'Confirmar';
      contentArea.appendChild(confirm);

      back.addEventListener('click', ()=>{ showMain(); });

      confirm.addEventListener('click', async ()=>{
        const name = (input.value || '').trim();
        if(!name){ alert('Informe o nome da nova subpasta.'); return; }
        try{
          if(!selected || !selected.parent) return alert('Nenhum item selecionado ou pasta pai inválida.');
          const targetDir = await selected.parent.getDirectoryHandle(name, {create:true});
          const okPerm = await ensureHandlePermission(targetDir, 'readwrite').catch(()=>false);
          if(!okPerm) return alert('Permissão negada para a pasta de destino.');
          await performMove(selected, targetDir);
          setSelected(null);
          cleanup();
          return true;
        }catch(e){ alert('Falha ao mover: ' + (e && e.message)); }
      });

      input.focus();
    }catch(e){ alert('Erro ao criar nova subpasta: ' + (e && e.message)); }
  });

  return true;
}
