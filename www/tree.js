import { treeContainer } from './ui.js';
import { getRootHandle, setSelected, getSelected } from './state.js';
import { showSelectedDirectory, showSelectedFile } from './content.js';

export async function renderApp(){
  treeContainer.innerHTML = '';
  if(!getRootHandle()) return;
  const ul = document.createElement('div');
  await buildAndRender(getRootHandle(), ul, getRootHandle().name || 'root');
  treeContainer.appendChild(ul);
}

export async function buildAndRender(dirHandle, container, displayName){
  const node = document.createElement('div');
  const btn = document.createElement('button');
  btn.className = 'w-full flex items-center text-left py-1 px-2 rounded hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100';
  const icon = document.createElement('span');
  icon.className = 'material-symbols-outlined align-middle mr-2 text-[18px]';
  icon.textContent = 'folder';
  btn.appendChild(icon);
  btn.appendChild(document.createTextNode(displayName));
  btn.addEventListener('click', async ()=>{
    setSelected({handle: dirHandle, name: displayName, parent: null, kind: 'directory'});
    markSelected(btn);
    await showSelectedDirectory(dirHandle, displayName);
  });
  node.appendChild(btn);
  const childrenCont = document.createElement('div');
  childrenCont.className = 'ml-3 mt-1 space-y-1';
  // Collect entries, then sort: directories first, then files; both alphabetically
  const entries = [];
  for await (const [name, handle] of dirHandle.entries()){
    entries.push([name, handle]);
  }
  entries.sort((a, b) => {
    const [nameA, handleA] = a;
    const [nameB, handleB] = b;
    if (handleA.kind !== handleB.kind){
      return handleA.kind === 'directory' ? -1 : 1;
    }
    return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
  });
  for (const [name, handle] of entries){
    if(handle.kind === 'directory'){
      const sub = document.createElement('div');
      const subBtn = document.createElement('button');
      subBtn.className = 'w-full flex items-center text-left py-1 px-2 rounded hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100';
      const sIcon = document.createElement('span');
      sIcon.className = 'material-symbols-outlined align-middle mr-2 text-[18px]';
      sIcon.textContent = 'folder';
      subBtn.appendChild(sIcon);
      subBtn.appendChild(document.createTextNode(name));
      subBtn.addEventListener('click', async (e)=>{
        e.stopPropagation();
        setSelected({handle, name, parent: dirHandle, kind: 'directory'});
        markSelected(subBtn);
        await showSelectedDirectory(handle, name);
      });
      sub.appendChild(subBtn);
      childrenCont.appendChild(sub);
    } else {
      const fileDiv = document.createElement('div');
      const fBtn = document.createElement('button');
      fBtn.className = 'w-full flex items-center text-left py-1 px-2 rounded hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100';
      const fIcon = document.createElement('span');
      fIcon.className = 'material-symbols-outlined align-middle mr-2 text-[18px]';
      fIcon.textContent = 'insert_drive_file';
      fBtn.appendChild(fIcon);
      fBtn.appendChild(document.createTextNode(name));
      fBtn.addEventListener('click', async ()=>{
        setSelected({handle, name, parent: dirHandle, kind: 'file'});
        markSelected(fBtn);
        await showSelectedFile(handle, name);
      });
      fileDiv.appendChild(fBtn);
      childrenCont.appendChild(fileDiv);
    }
  }
  node.appendChild(childrenCont);
  container.appendChild(node);
}

function clearSelectedClasses(){
  const btns = treeContainer.querySelectorAll('button');
  btns.forEach(b=>{
    b.classList.remove('bg-slate-200','text-slate-900','dark:bg-slate-700','dark:text-slate-100','font-semibold');
    b.removeAttribute('aria-selected');
  });
}

function markSelected(btn){
  clearSelectedClasses();
  btn.classList.add('bg-slate-200','text-slate-900','dark:bg-slate-700','dark:text-slate-100','font-semibold');
  btn.setAttribute('aria-selected','true');
}

