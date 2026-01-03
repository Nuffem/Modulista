import { treeContainer } from './ui.js';
import { getRootHandle, setSelected, getSelected, isExpanded, toggleExpanded, setExpanded } from './state.js';
import { showSelectedDirectory, showSelectedFile } from './content.js';
export async function renderApp(){
  treeContainer.innerHTML = '';
  if(!getRootHandle()) return;
  const rootName = getRootHandle().name || 'root';
  const rootCont = document.createElement('div');
  await buildAndRender(getRootHandle(), rootCont, rootName, rootName);
  treeContainer.appendChild(rootCont);
}

export async function buildAndRender(dirHandle, container, displayName, path){
  const node = document.createElement('div');

  const row = document.createElement('div');
  row.className = 'flex items-center';

  // Toggle button (chevron)
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'p-0 mr-1 text-[18px]';
  const toggleIcon = document.createElement('span');
  toggleIcon.className = 'material-symbols-outlined';
  toggleIcon.textContent = isExpanded(path) ? 'expand_more' : 'chevron_right';
  toggleBtn.appendChild(toggleIcon);
  toggleBtn.addEventListener('click', async (e)=>{
    e.stopPropagation();
    const expanded = isExpanded(path);
    if(expanded){
      childrenCont.style.display = 'none';
      toggleIcon.textContent = 'chevron_right';
      setExpanded(path, false);
    } else {
      // populate lazily if empty
      if(!childrenCont.hasChildNodes()){
        await populateChildren(dirHandle, childrenCont, path);
      }
      childrenCont.style.display = 'block';
      toggleIcon.textContent = 'expand_more';
      setExpanded(path, true);
    }
  });

  // Folder icon + name button
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

  row.appendChild(toggleBtn);
  row.appendChild(btn);
  node.appendChild(row);

  const childrenCont = document.createElement('div');
  childrenCont.className = 'ml-3 mt-1 space-y-1';
  childrenCont.style.display = isExpanded(path) ? 'block' : 'none';

  // If the directory is already expanded in state, populate now
  if(isExpanded(path)){
    await populateChildren(dirHandle, childrenCont, path);
  }

  node.appendChild(childrenCont);
  container.appendChild(node);
}

async function populateChildren(dirHandle, childrenCont, parentPath){
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
      // Render a directory node (collapsed by default)
      await buildAndRender(handle, childrenCont, name, `${parentPath}/${name}`);
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

