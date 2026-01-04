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

export async function moveToNew(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent) return alert('Mover a raiz não é suportado.');

  const prev = document.getElementById('move-new-form'); if(prev) prev.remove();
  try{ enterCommandDetailMode(document.getElementById('moveNewBtn')); }catch(_){ }

  const form = document.createElement('div');
  form.id = 'move-new-form';
  form.className = 'mt-2 flex flex-col space-y-2';

  const contentArea = document.createElement('div');
  contentArea.className = 'mt-2';
  form.appendChild(contentArea);
  if(commands) commands.appendChild(form);

  const cleanup = ()=>{ try{ exitCommandDetailMode(); }catch(_){ const el = document.getElementById('move-new-form'); if(el) el.remove(); } };

  try{
    contentArea.innerHTML = '';
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

  return true;
}
