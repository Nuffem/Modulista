import { contentArea, contentTitle } from './ui.js';
import { getSelected, setSelected } from './state.js';
import { getIconForFile } from './icons.js';

const allowedTextExtensions = new Set([
  'txt','md','markdown','js','ts','css','html','json','csv','xml','log',
  'py','java','c','cpp','rs','go','sh'
]);

const allowedImageExtensions = new Set([
  'png','jpg','jpeg','gif','webp','svg','ico','avif','bmp'
]);

function isTextFile(mime, name){
  if(mime && typeof mime === 'string'){
    if(mime.startsWith('text/')) return true;
    const textual = new Set([
      'application/json','application/javascript','application/xml',
      'application/xhtml+xml','application/atom+xml','application/rss+xml',
      'application/ld+json','application/sql'
    ]);
    return textual.has(mime);
  }
  // fallback para casos onde o MIME não está disponível: usar extensão
  if(!name || typeof name !== 'string') return false;
  const idx = name.lastIndexOf('.');
  if(idx === -1) return false;
  const ext = name.slice(idx+1).toLowerCase();
  return allowedTextExtensions.has(ext);
}

function isImageFile(mime, name){
  if(mime && typeof mime === 'string'){
    return mime.startsWith('image/');
  }
  // fallback por extensão
  if(!name || typeof name !== 'string') return false;
  const idx = name.lastIndexOf('.');
  if(idx === -1) return false;
  const ext = name.slice(idx+1).toLowerCase();
  return allowedImageExtensions.has(ext);
}

function isPdfFile(mime, name){
  if(mime && typeof mime === 'string'){
    return mime === 'application/pdf';
  }
  if(!name || typeof name !== 'string') return false;
  const idx = name.lastIndexOf('.');
  if(idx === -1) return false;
  const ext = name.slice(idx+1).toLowerCase();
  return ext === 'pdf';
}

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

export async function showSelectedDirectory(handle, name){
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
    const file = await handle.getFile();
    const meta = document.createElement('div');
    meta.className = 'text-xs text-gray-500 mb-2';
    const mime = file.type || '—';
    meta.textContent = `${mime} • ${formatBytes(file.size)} • ${formatDate(file.lastModified)}`;
    contentArea.appendChild(meta);

    if(!isTextFile(mime, name)){
      // se for imagem, exibir preview
      if(isImageFile(mime, name)){
        const url = URL.createObjectURL(file);
        const imgWrap = document.createElement('div');
        imgWrap.className = 'w-full flex justify-center';
        const img = document.createElement('img');
        img.src = url;
        img.alt = name;
        img.className = 'max-w-full max-h-[60vh] object-contain border rounded';
        img.addEventListener('load', ()=> URL.revokeObjectURL(url));
        img.addEventListener('error', ()=> {
          URL.revokeObjectURL(url);
          contentArea.textContent = 'Não foi possível exibir a imagem.';
        });
        imgWrap.appendChild(img);
        contentArea.appendChild(imgWrap);
        return;
      }

      // se for PDF, embutir usando <object>
      if(isPdfFile(mime, name)){
        const url = URL.createObjectURL(file);
        const wrap = document.createElement('div');
        wrap.className = 'w-full';
        const obj = document.createElement('object');
        obj.data = url;
        obj.type = 'application/pdf';
        obj.className = 'w-full h-[80vh] border rounded';
        obj.innerHTML = 'Seu navegador não suporta exibir PDFs. <a href="' + url + '" target="_blank" rel="noopener">Abrir em nova aba</a>.';
        // tentar liberar o blob URL quando possível
        obj.addEventListener && obj.addEventListener('load', ()=> URL.revokeObjectURL(url));
        obj.addEventListener && obj.addEventListener('error', ()=> {
          URL.revokeObjectURL(url);
          contentArea.textContent = 'Não foi possível exibir o PDF.';
        });
        wrap.appendChild(obj);
        contentArea.appendChild(wrap);
        return;
      }

      const msg = document.createElement('div');
      msg.textContent = 'Não foi possível ler o arquivo.';
      contentArea.appendChild(msg);
      return;
    }

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
