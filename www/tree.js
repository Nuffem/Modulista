import { treeContainer } from './ui.js';
import { getRootHandle, setSelected } from './state.js';
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
  btn.className = 'w-full text-left py-1 px-2 rounded hover:bg-slate-50';
  btn.textContent = displayName;
  btn.addEventListener('click', ()=>{
    setSelected({handle: dirHandle, name: displayName, parent: null, kind: 'directory'});
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
        setSelected({handle, name, parent: dirHandle, kind: 'directory'});
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
        setSelected({handle, name, parent: dirHandle, kind: 'file'});
        await showSelectedFile(handle, name);
      });
      fileDiv.appendChild(fBtn);
      childrenCont.appendChild(fileDiv);
    }
  }
  node.appendChild(childrenCont);
  container.appendChild(node);
}
