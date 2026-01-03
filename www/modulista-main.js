import './picker.js';
import './theme.js';
import { setRootHandle, clearState, getSelected, persistRootHandle, restoreRootHandle, deletePersistedRoot, ensureHandlePermission } from './state.js';
import { openBtn, closeFolderBtn, renameBtn, treeContainer, contentArea, contentTitle, restoreModal, restoreBtn, openNewBtn } from './ui.js';
import { setHash, renderByHash } from './picker.js';
import { renderApp } from './tree.js';
import { renameSelected } from './content.js';

async function openFolder(){
  try{
    const root = await window.showDirectoryPicker();
    setRootHandle(root);
    await persistRootHandle();
    setHash('/open');
    await renderApp();
  }catch(e){
    console.warn('picker cancelled', e);
  }
}

openBtn.addEventListener('click', openFolder);

closeFolderBtn.addEventListener('click', async ()=>{
  clearState();
  await deletePersistedRoot();
  setHash('/');
  treeContainer.innerHTML = '';
  contentArea.innerHTML = '';
  contentTitle.textContent = 'Conteúdo';
});

renameBtn.addEventListener('click', async ()=>{
  const ok = await renameSelected();
  if(ok) await renderApp();
});

(async function init(){
  const restored = await restoreRootHandle();
  if(restored){
    // check if we already have permission
    let q = null;
    try{ q = await (typeof restored.queryPermission === 'function' ? restored.queryPermission({ mode: 'readwrite' }) : 'granted'); }catch(e){ q = null; }
    if(q === 'granted'){
      setRootHandle(restored);
      setHash('/open');
      renderByHash();
      await renderApp();
      return;
    }

    // show modal to let user decide (requestPermission requires user activation)
    // ensure main view is visible first (avoids picker remaining visible under modal)
    setHash('/open');
    if(restoreModal){
      restoreModal.classList.remove('hidden');
    }

    const cleanup = ()=>{ if(restoreModal) restoreModal.classList.add('hidden'); };

    const onRestore = async ()=>{
      cleanup();
      const ok = await ensureHandlePermission(restored, 'readwrite').catch(()=>false);
      if(ok){
        setRootHandle(restored);
        setHash('/open');
        renderByHash();
        await renderApp();
        return;
      }
      await deletePersistedRoot();
      renderByHash();
    };

    const onOpenNew = async ()=>{
      cleanup();
      await deletePersistedRoot();
      await openFolder();
    };

    restoreBtn?.addEventListener('click', onRestore, { once: true });
    openNewBtn?.addEventListener('click', onOpenNew, { once: true });
    // If user dismisses modal by clicking outside, fallback to renderByHash
    restoreModal?.addEventListener('click', (e)=>{
      if(e.target === restoreModal){ cleanup(); renderByHash(); }
    }, { once: true });
  }
  renderByHash();
})();
