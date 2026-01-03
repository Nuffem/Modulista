import './picker.js';
import './theme.js';
import { setRootHandle, clearState, getSelected, getRootHandle, persistRootHandle, restoreRootHandle, deletePersistedRoot, ensureHandlePermission } from './state.js';
import { openBtn, closeFolderBtn, renameBtn, treeContainer, contentArea, contentTitle, restoreModal, restoreBtn, openNewBtn } from './ui.js';
import { setHash, renderByHash } from './picker.js';
import { renderApp } from './tree.js';
import { renameSelected } from './command.js';

async function openFolder(){
  try{
    const root = await window.showDirectoryPicker();
    setRootHandle(root);
    await persistRootHandle();
    setHash('/');
    await renderApp(location.hash.replace('#','') || '/');
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
  if(ok) await renderApp(location.hash.replace('#','') || '/');
});

(async function init(){
  const restored = await restoreRootHandle();
  if(restored){
    // check if we already have permission
    let q = null;
    try{ q = await (typeof restored.queryPermission === 'function' ? restored.queryPermission({ mode: 'readwrite' }) : 'granted'); }catch(e){ q = null; }
    if(q === 'granted'){
      setRootHandle(restored);
      setHash('/');
      renderByHash();
      await renderApp(location.hash.replace('#','') || '/');
      return;
    }

    // show modal to let user decide (requestPermission requires user activation)
    // ensure main view is visible first (avoids picker remaining visible under modal)
    setHash('/');
    if(restoreModal){
      restoreModal.classList.remove('hidden');
    }

    const cleanup = ()=>{ if(restoreModal) restoreModal.classList.add('hidden'); };

    const onRestore = async ()=>{
      cleanup();
      const ok = await ensureHandlePermission(restored, 'readwrite').catch(()=>false);
      if(ok){
        setRootHandle(restored);
        setHash('/');
        renderByHash();
        await renderApp(location.hash.replace('#','') || '/');
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

// --- Splitter / column resize logic ---
function setupSplitters(){
  const container = document.getElementById('splitContainer');
  const treePane = document.getElementById('treePane');
  const contentPane = document.getElementById('contentPane');
  const commandsPane = document.getElementById('commandsPane');
  const resizerLeft = document.getElementById('resizerLeft');
  const resizerRight = document.getElementById('resizerRight');
  if(!container || !treePane || !contentPane || !commandsPane) return;

  const MIN_TREE = 180;
  const MIN_COMMANDS = 160;
  const MIN_CONTENT = 300;

  // Apply persisted sizes if present
  const savedTree = localStorage.getItem('modulista.treeWidth');
  const savedCommands = localStorage.getItem('modulista.commandsWidth');
  if(savedTree) treePane.style.width = savedTree + 'px';
  if(savedCommands) commandsPane.style.width = savedCommands + 'px';

  function setTreeWidth(px){
    const containerRect = container.getBoundingClientRect();
    const commandsWidth = commandsPane.getBoundingClientRect().width;
    const max = Math.max(MIN_TREE, containerRect.width - commandsWidth - MIN_CONTENT);
    const w = Math.max(MIN_TREE, Math.min(px, max));
    treePane.style.width = w + 'px';
    localStorage.setItem('modulista.treeWidth', String(w));
  }

  function setCommandsWidth(px){
    const containerRect = container.getBoundingClientRect();
    const treeWidth = treePane.getBoundingClientRect().width;
    const max = Math.max(MIN_COMMANDS, containerRect.width - treeWidth - MIN_CONTENT);
    const w = Math.max(MIN_COMMANDS, Math.min(px, max));
    commandsPane.style.width = w + 'px';
    localStorage.setItem('modulista.commandsWidth', String(w));
  }

  // Left resizer: drag horizontally to change treePane width
  if(resizerLeft){
    const onPointerDown = (e)=>{
      e.preventDefault();
      const move = (ev)=>{
        const rect = container.getBoundingClientRect();
        const px = ev.clientX - rect.left;
        setTreeWidth(px);
      };
      const up = ()=>{ window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
    };
    resizerLeft.addEventListener('pointerdown', onPointerDown);
    // keyboard accessibility
    resizerLeft.addEventListener('keydown', (e)=>{
      const step = e.shiftKey ? 20 : 8;
      const current = treePane.getBoundingClientRect().width;
      if(e.key === 'ArrowLeft') setTreeWidth(current - step);
      if(e.key === 'ArrowRight') setTreeWidth(current + step);
    });
  }

  // Right resizer: drag to change commandsPane width
  if(resizerRight){
    const onPointerDown = (e)=>{
      e.preventDefault();
      const move = (ev)=>{
        const rect = container.getBoundingClientRect();
        const pxFromRight = rect.right - ev.clientX;
        setCommandsWidth(pxFromRight);
      };
      const up = ()=>{ window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
    };
    resizerRight.addEventListener('pointerdown', onPointerDown);
    resizerRight.addEventListener('keydown', (e)=>{
      const step = e.shiftKey ? 20 : 8;
      const current = commandsPane.getBoundingClientRect().width;
      if(e.key === 'ArrowLeft') setCommandsWidth(current + step);
      if(e.key === 'ArrowRight') setCommandsWidth(current - step);
    });
  }

  // Adjust on window resize to ensure constraints remain valid
  window.addEventListener('resize', ()=>{
    const treeW = treePane.getBoundingClientRect().width;
    const cmdW = commandsPane.getBoundingClientRect().width;
    const containerRect = container.getBoundingClientRect();
    // ensure content has at least MIN_CONTENT
    const available = containerRect.width - treeW - cmdW;
    if(available < MIN_CONTENT){
      // try to shrink commands first, then tree
      const deficit = MIN_CONTENT - available;
      const newCmd = Math.max(MIN_COMMANDS, cmdW - deficit);
      commandsPane.style.width = newCmd + 'px';
      localStorage.setItem('modulista.commandsWidth', String(newCmd));
    }
  });
}

setupSplitters();
// keep UI and tree in sync when user navigates with back/forward or changes hash
let lastHandledHash = null;
function handleNavigation(){
  const hash = location.hash.replace('#','') || '/';
  if(hash === lastHandledHash) return; // ignore duplicate events
  lastHandledHash = hash;
  renderByHash();
  if(getRootHandle()){
    // renderApp is async; return the promise to allow callers to await if needed
    renderApp(hash).catch(console.warn);
  }
}
window.addEventListener('popstate', handleNavigation);
window.addEventListener('hashchange', handleNavigation);
