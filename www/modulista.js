let rootHandle = null;
let selected = null;
const app = document.getElementById('app');
const pickerView = document.getElementById('pickerView');
const mainView = document.getElementById('mainView');
const openBtn = document.getElementById('openBtn');
const closeFolderBtn = document.getElementById('closeFolderBtn');
const treeContainer = document.getElementById('treeContainer');
const contentArea = document.getElementById('contentArea');
const contentTitle = document.getElementById('contentTitle');
const renameBtn = document.getElementById('renameBtn');

function setHash(path){
  location.hash = path;
}

window.addEventListener('hashchange', renderByHash);

function renderByHash(){
  const h = location.hash.replace('#','');
  if(!h || h === '/' ){
    pickerView.classList.remove('hidden');
    mainView.classList.add('hidden');
  } else {
    pickerView.classList.add('hidden');
    mainView.classList.remove('hidden');
  }
}

async function openFolder(){
  try{
    rootHandle = await window.showDirectoryPicker();
    setHash('/open');
    await renderApp();
  }catch(e){
    console.warn('picker cancelled', e);
  }
}

openBtn.addEventListener('click', openFolder);

closeFolderBtn.addEventListener('click', async ()=>{
  rootHandle = null;
  selected = null;
  setHash('/');
  treeContainer.innerHTML = '';
  contentArea.innerHTML = '';
  contentTitle.textContent = 'Conteúdo';
});

async function renderApp(){
  treeContainer.innerHTML = '';
  contentArea.innerHTML = '';
  contentTitle.textContent = 'Conteúdo';
  if(!rootHandle) return;
  const ul = document.createElement('div');
  await buildAndRender(rootHandle, ul, rootHandle.name || 'root');
  treeContainer.appendChild(ul);
}

async function buildAndRender(dirHandle, container, displayName){
  const node = document.createElement('div');
  const btn = document.createElement('button');
  btn.className = 'w-full text-left py-1 px-2 rounded hover:bg-slate-50';
  btn.textContent = displayName;
  btn.addEventListener('click', ()=>{
    selected = {handle: dirHandle, name: displayName, parent: null, kind: 'directory'};
    showSelectedDirectory(dirHandle, displayName);
  });
  node.appendChild(btn);
  const childrenCont = document.createElement('div');
  childrenCont.className = 'ml-3 mt-1 space-y-1';
  for await (const [name, handle] of dirHandle.entries()){
    if(handle.kind === 'directory'){
      const sub = document.createElement('div');
      const subBtn = document.createElement('button');
      subBtn.className = 'w-full text-left py-1 px-2 rounded hover:bg-slate-50';
      subBtn.textContent = name + '/';
      subBtn.addEventListener('click', async (e)=>{
        e.stopPropagation();
        selected = {handle, name, parent: dirHandle, kind: 'directory'};
        await showSelectedDirectory(handle, name);
      });
      sub.appendChild(subBtn);
      childrenCont.appendChild(sub);
    } else {
      const fileDiv = document.createElement('div');
      const fBtn = document.createElement('button');
      fBtn.className = 'w-full text-left py-1 px-2 rounded hover:bg-slate-50';
      fBtn.textContent = name;
      fBtn.addEventListener('click', async ()=>{
        selected = {handle, name, parent: dirHandle, kind: 'file'};
        await showSelectedFile(handle, name);
      });
      fileDiv.appendChild(fBtn);
      childrenCont.appendChild(fileDiv);
    }
  }
  node.appendChild(childrenCont);
  container.appendChild(node);
}

async function showSelectedDirectory(handle, name){
  contentTitle.textContent = name + '/';
  contentArea.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'space-y-1';
  for await (const [entryName, entryHandle] of handle.entries()){
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 border rounded';
    const left = document.createElement('div');
    left.textContent = entryName + (entryHandle.kind === 'directory' ? '/' : '');
    row.appendChild(left);
    list.appendChild(row);
  }
  contentArea.appendChild(list);
}

async function showSelectedFile(handle, name){
  contentTitle.textContent = name;
  contentArea.innerHTML = '';
  try{
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

async function renameSelected(){
  if(!selected) return alert('Nenhum item selecionado');
  const newName = prompt('Novo nome:', selected.name);
  if(!newName || newName === selected.name) return;
  if(!selected.parent){
    return alert('Renomear a raiz não é suportado.');
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
      await copyDirectory(selected.parent, selected.name, newName);
      await selected.parent.removeEntry(selected.name, {recursive: true});
    }
    await renderApp();
  }catch(e){
    alert('Falha ao renomear: ' + e.message);
  }
}

async function copyDirectory(parentHandle, sourceName, targetName){
  const source = await parentHandle.getDirectoryHandle(sourceName);
  const target = await parentHandle.getDirectoryHandle(targetName, {create:true});
  for await (const [name, handle] of source.entries()){
    if(handle.kind === 'file'){
      const f = await handle.getFile();
      const newF = await target.getFileHandle(name, {create:true});
      const w = await newF.createWritable();
      await w.write(await f.arrayBuffer());
      await w.close();
    } else {
      await copyDirectory(source, name, name).then(()=>{}).catch(()=>{});
      const nestedSource = await source.getDirectoryHandle(name);
      const nestedTarget = await target.getDirectoryHandle(name, {create:true});
      for await (const [nName, nHandle] of nestedSource.entries()){
        if(nHandle.kind === 'file'){
          const f = await nHandle.getFile();
          const newF = await nestedTarget.getFileHandle(nName, {create:true});
          const w = await newF.createWritable();
          await w.write(await f.arrayBuffer());
          await w.close();
        }
      }
    }
  }
}

renameBtn.addEventListener('click', renameSelected);

renderByHash();
