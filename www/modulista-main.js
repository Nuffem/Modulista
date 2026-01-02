import './picker.js';
import { setRootHandle, clearState, getSelected } from './state.js';
import { openBtn, closeFolderBtn, renameBtn, treeContainer, contentArea, contentTitle } from './ui.js';
import { setHash, renderByHash } from './picker.js';
import { renderApp } from './tree.js';
import { renameSelected } from './content.js';

async function openFolder(){
  try{
    const root = await window.showDirectoryPicker();
    setRootHandle(root);
    setHash('/open');
    await renderApp();
  }catch(e){
    console.warn('picker cancelled', e);
  }
}

openBtn.addEventListener('click', openFolder);

closeFolderBtn.addEventListener('click', async ()=>{
  clearState();
  setHash('/');
  treeContainer.innerHTML = '';
  contentArea.innerHTML = '';
  contentTitle.textContent = 'Conteúdo';
});

renameBtn.addEventListener('click', async ()=>{
  const ok = await renameSelected();
  if(ok) await renderApp();
});

renderByHash();
