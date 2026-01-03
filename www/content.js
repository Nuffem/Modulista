import { contentArea, contentTitle, commands } from './ui.js';
import { getSelected, setSelected } from './state.js';
import { setHash } from './picker.js';
import { getIconForFile } from './icons.js';

function formatBytes(bytes){
  if(!bytes && bytes !== 0) return '—';
  if(bytes < 1024) return bytes + ' B';
  const units = ['KB','MB','GB','TB'];
  let i = -1;
  do { bytes = bytes / 1024; i++; } while(bytes >= 1024 && i < units.length-1);
  return bytes.toFixed(1) + ' ' + units[i];
}

function formatDate(ms){
  if(!ms && ms !== 0) return '—';
  return new Date(ms).toLocaleString();
}

export async function showSelectedDirectory(handle, name, path = ''){
  contentTitle.textContent = name;
  contentArea.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'space-y-1';
  // coletar entradas, ordenar (pastas primeiro, depois arquivos), ambas alfabeticamente
  const entries = [];
  for await (const [entryName, entryHandle] of handle.entries()){
    entries.push([entryName, entryHandle]);
  }
  entries.sort((a, b) => {
    const [nameA, handleA] = a;
    const [nameB, handleB] = b;
    const aIsDir = handleA.kind === 'directory';
    const bIsDir = handleB.kind === 'directory';
    if(aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return nameA.localeCompare(nameB, undefined, {sensitivity: 'base', numeric: true});
  });

  // calcular metadados (contagem e tamanho total dos arquivos)
  const dirCount = entries.filter(([,h]) => h.kind === 'directory').length;
  const fileEntries = entries.filter(([,h]) => h.kind === 'file');
  let totalSize = 0;
  if(fileEntries.length > 0){
    try{
      const sizes = await Promise.all(fileEntries.map(([,h]) => h.getFile().then(f => f.size).catch(() => 0)));
      totalSize = sizes.reduce((a,b) => a + b, 0);
    }catch(e){
      totalSize = 0;
    }
  }
  const meta = document.createElement('div');
  meta.className = 'text-xs text-gray-500 mb-2';
  meta.textContent = `${dirCount} pastas • ${fileEntries.length} arquivos • ${formatBytes(totalSize)}`;
  contentArea.appendChild(meta);

  for (const [entryName, entryHandle] of entries){
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'flex items-center justify-between p-2 border rounded w-full text-left';

    const leftBtn = document.createElement('div');
    leftBtn.className = 'flex items-center w-full';

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

    // tornar a linha inteira clicável
    row.addEventListener('click', async (e)=>{
      const entryPath = path ? (path + '/' + entryName) : ('/' + entryName);
      const nodePath = entryPath.startsWith('/') ? entryPath : ('/' + entryPath);
      setSelected({handle: entryHandle, name: entryName, parent: handle, kind: entryHandle.kind, path: nodePath});
      setHash(nodePath);
      if(entryHandle.kind === 'directory'){
        await showSelectedDirectory(entryHandle, entryName, nodePath);
      } else {
        await showSelectedFile(entryHandle, entryName, nodePath);
      }
    });

    row.appendChild(leftBtn);
    list.appendChild(row);
  }
  contentArea.appendChild(list);
}

export async function showSelectedFile(handle, name, path = ''){
  contentTitle.textContent = name;
  contentArea.innerHTML = '';
  try{
    const file = await handle.getFile();
    const meta = document.createElement('div');
    meta.className = 'text-xs text-gray-500 mb-2';
    const mime = file.type || 'application/octet-stream';
    meta.textContent = `${mime} • ${formatBytes(file.size)} • ${formatDate(file.lastModified)}`;
    contentArea.appendChild(meta);

    // Sempre usar <object> para embutir o conteúdo, passando o MIME type
    const url = URL.createObjectURL(file);
    const wrap = document.createElement('div');
    wrap.className = 'w-full';
    const obj = document.createElement('object');
    obj.data = url;
    obj.type = mime;
    obj.className = 'w-full h-[80vh] border rounded';
    obj.innerHTML = 'Não é possível exibir o conteúdo. <a href="' + url + '" target="_blank" rel="noopener">Abrir em nova aba</a>.';
    // tentar liberar o blob URL quando possível
    obj.addEventListener && obj.addEventListener('load', ()=> URL.revokeObjectURL(url));
    obj.addEventListener && obj.addEventListener('error', ()=> {
      URL.revokeObjectURL(url);
      contentArea.textContent = 'Não foi possível exibir o arquivo.';
    });
    wrap.appendChild(obj);
    contentArea.appendChild(wrap);
  }catch(e){
    contentArea.textContent = 'Não foi possível ler o arquivo.';
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
