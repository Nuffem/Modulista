import { commands, createCommandProgress, enterCommandDetailMode, exitCommandDetailMode } from '../ui.js';
import { getSelected, setSelected, ensureHandlePermission } from '../state.js';
import { copyDirectory } from '../commands.js';

async function performMove(selectedItem, targetDir){
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
}

export async function moveToExisting(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent) return alert('Mover a raiz não é suportado.');

  const prev = document.getElementById('move-existing-form'); if(prev) prev.remove();
  try{ enterCommandDetailMode(document.getElementById('moveExistingBtn')); }catch(_){ }

  const form = document.createElement('div');
  form.id = 'move-existing-form';
  form.className = 'mt-2 flex flex-col space-y-2';

  const contentArea = document.createElement('div');
  contentArea.className = 'mt-2';
  form.appendChild(contentArea);
  if(commands) commands.appendChild(form);

  const cleanup = ()=>{ try{ exitCommandDetailMode(); }catch(_){ const el = document.getElementById('move-existing-form'); if(el) el.remove(); } };

  try{
    contentArea.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'mt-2 space-y-1';
    contentArea.appendChild(list);

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

  return true;
}
