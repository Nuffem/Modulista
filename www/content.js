import { contentArea, contentTitle } from './ui.js';
import { getSelected, setSelected } from './state.js';
import { getIconForFile } from './icons.js';

const allowedTextExtensions = new Set([
  'txt','md','markdown','js','ts','css','html','json','csv','xml','log',
  'py','java','c','cpp','rs','go','sh'
]);

function isTextFileByName(name){
  if(!name || typeof name !== 'string') return false;
  const idx = name.lastIndexOf('.');
  if(idx === -1) return false;
  const ext = name.slice(idx+1).toLowerCase();
  return allowedTextExtensions.has(ext);
}

export async function showSelectedDirectory(handle, name){
  contentTitle.textContent = name;
  contentArea.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'space-y-1';
  for await (const [entryName, entryHandle] of handle.entries()){
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 border rounded';

    const leftBtn = document.createElement('button');
    leftBtn.className = 'flex items-center w-full text-left';

    const icon = document.createElement('span');
    icon.className = 'material-symbols-outlined align-middle mr-2 text-[18px]';
    icon.setAttribute('aria-hidden','true');
    if(entryHandle.kind === 'directory'){
      icon.textContent = 'folder';
    } else {
      icon.textContent = getIconForFile(entryName);
    }

    leftBtn.appendChild(icon);
    leftBtn.appendChild(document.createTextNode(entryName));

    leftBtn.addEventListener('click', async ()=>{
      setSelected({handle: entryHandle, name: entryName, parent: handle, kind: entryHandle.kind});
      if(entryHandle.kind === 'directory'){
        await showSelectedDirectory(entryHandle, entryName);
      } else {
        await showSelectedFile(entryHandle, entryName);
      }
    });

    row.appendChild(leftBtn);
    list.appendChild(row);
  }
  contentArea.appendChild(list);
}

export async function showSelectedFile(handle, name){
  contentTitle.textContent = name;
  contentArea.innerHTML = '';
  try{
    if(!isTextFileByName(name)){
      contentArea.textContent = 'Não foi possível ler o arquivo.';
      return;
    }
    const file = await handle.getFile();
    const text = await file.text();
    const pre = document.createElement('pre');
    pre.className = 'whitespace-pre-wrap text-sm';
    pre.textContent = text;
    contentArea.appendChild(pre);
  }catch(e){
    contentArea.textContent = 'Não foi possível ler o arquivo.';
  }
}

export async function renameSelected(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  const newName = prompt('Novo nome:', selected.name);
  if(!newName || newName === selected.name) return false;
  if(!selected.parent){
    alert('Renomear a raiz não é suportado.');
    return false;
  }
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
    // clear selection after rename
    setSelected(null);
    return true;
  }catch(e){
    alert('Falha ao renomear: ' + (e && e.message));
    return false;
  }
}

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
