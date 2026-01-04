import { contentArea, contentTitle, commands, createListContainer, createMetaElement, createEntryRow, createObjectPreview } from './ui.js';
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
  const list = createListContainer();
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
  const meta = createMetaElement(`${dirCount} pastas • ${fileEntries.length} arquivos • ${formatBytes(totalSize)}`);
  contentArea.appendChild(meta);

  for (const [entryName, entryHandle] of entries){
    const iconName = entryHandle.kind === 'directory' ? 'folder' : getIconForFile(entryName);
    const row = createEntryRow(entryName, iconName);

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

    list.appendChild(row);
  }
  contentArea.appendChild(list);
}

export async function showSelectedFile(handle, name, path = ''){
  contentTitle.textContent = name;
  contentArea.innerHTML = '';
  try{
    const file = await handle.getFile();
    const mime = file.type || 'application/octet-stream';
    const meta = createMetaElement(`${mime} • ${formatBytes(file.size)} • ${formatDate(file.lastModified)}`);
    contentArea.appendChild(meta);
    const url = URL.createObjectURL(file);
    const wrap = createObjectPreview(url, mime);
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
