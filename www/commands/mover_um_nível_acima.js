import { getSelected, setSelected, ensureHandlePermission, getRootHandle } from '../state.js';
import { copyDirectory, getDirByPath } from '../commands.js';

export async function moveUpSelected(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent){
    alert('Mover a raiz não é suportado.');
    return false;
  }
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
    return true;
  }catch(e){ alert('Falha ao mover: ' + (e && e.message)); return false; }
}
