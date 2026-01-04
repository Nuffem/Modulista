import './picker.js';
import './theme.js';
import { setRootHandle, clearState, getSelected, getRootHandle, persistRootHandle, restoreRootHandle, deletePersistedRoot, ensureHandlePermission } from './state.js';
import { openBtn, closeFolderBtn, renameBtn, moveBtn, treeContainer, contentArea, contentTitle, restoreModal, restoreBtn, openNewBtn, closeFolderModal, closeModalOpenNewBtn, closeModalConfirmBtn, closeModalCloseBtn, modelLoadContainer } from './ui.js';
import { setHash, renderByHash } from './picker.js';
import { renderApp } from './tree.js';
import { renameSelected, moveSelected, moveUpSelected } from './commands.js';
import { moveUpBtn } from './ui.js';

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

// abrir modal de gerenciamento da pasta (substitui o fechamento direto)
closeFolderBtn.addEventListener('click', ()=>{
  if(closeFolderModal) closeFolderModal.classList.remove('hidden');
});

// Conectar botões do modal: Abrir outra e Fechar pasta
if(closeModalOpenNewBtn){
  closeModalOpenNewBtn.addEventListener('click', async ()=>{
    if(closeFolderModal) closeFolderModal.classList.add('hidden');
    await deletePersistedRoot();
    await openFolder();
  });
}

if(closeModalConfirmBtn){
  closeModalConfirmBtn.addEventListener('click', async ()=>{
    if(closeFolderModal) closeFolderModal.classList.add('hidden');
    clearState();
    await deletePersistedRoot();
    setHash('/');
    treeContainer.innerHTML = '';
    contentArea.innerHTML = '';
    contentTitle.textContent = 'Conteúdo';
  });
}

if(closeModalCloseBtn){
  closeModalCloseBtn.addEventListener('click', ()=>{ if(closeFolderModal) closeFolderModal.classList.add('hidden'); });
}

renameBtn.addEventListener('click', async ()=>{
  const ok = await renameSelected();
  if(ok) await renderApp(location.hash.replace('#','') || '/');
});

moveBtn?.addEventListener('click', async ()=>{
  const ok = await moveSelected();
  if(ok) await renderApp(location.hash.replace('#','') || '/');
});

moveUpBtn?.addEventListener('click', async ()=>{
  const ok = await moveUpSelected();
  if(ok) await renderApp(location.hash.replace('#','') || '/');
});

(async function init(){
  // iniciar carregamento do modelo IA em background (começa com carregamento da página)
  startModelLoader();

  const restored = await restoreRootHandle();
  if(restored){
    // check if we already have permission
    let q = null;
    try{ q = await (typeof restored.queryPermission === 'function' ? restored.queryPermission({ mode: 'read' }) : 'granted'); }catch(e){ q = null; }
    if(q === 'granted'){
      setRootHandle(restored);
      setHash('/');
      renderByHash();
      await renderApp(location.hash.replace('#','') || '/');
      return;
    }

    // show modal to let user decide (requestPermission requires user activation)
    setHash('/');
    if(restoreModal){
      restoreModal.classList.remove('hidden');
    }

    const cleanup = ()=>{ if(restoreModal) restoreModal.classList.add('hidden'); };

    const onRestore = async ()=>{
      cleanup();
      const ok = await ensureHandlePermission(restored, 'read').catch(()=>false);
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

// --- Modelo IA: carregamento em background ---
function startModelLoader(){
  if(window.webModelLoadPromise) return window.webModelLoadPromise;
  window.webModelReady = false;
  window.__webllm_model_name = '';

  const iaSetting = localStorage.getItem('modulista.iaEnabled');
  const iaEnabled = iaSetting === null ? true : (iaSetting === 'true');

  const container = modelLoadContainer || document.getElementById('modelLoadCard') || document.getElementById('commands') || document.body;
  const card = document.createElement('div');
  card.className = 'p-3 bg-slate-50 dark:bg-slate-800 rounded shadow';

  const top = document.createElement('div');
  top.className = 'flex items-center gap-2 mb-2';
  if(!iaEnabled){
    top.innerHTML = '<span class="material-symbols-outlined">smart_toy</span><div class="flex-1"><div class="text-sm font-semibold">Carregamento de IA desativado</div><div class="text-xs text-slate-600 dark:text-slate-300">Ative nas configurações para carregar o modelo.</div></div>';
  }else{
    top.innerHTML = '<span class="material-symbols-outlined">smart_toy</span><div class="flex-1"><div class="text-sm font-semibold">Carregando modelo de IA</div><div class="text-xs text-slate-600 dark:text-slate-300 webllm-status-container"><div class="webllm-status-text">—</div><div class="webllm-model-name">—</div></div></div>';
  }

  // toggle
  const toggleWrap = document.createElement('div');
  toggleWrap.className = 'mt-3';
  toggleWrap.innerHTML = '<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" class="ia-toggle" ' + (iaEnabled ? 'checked' : '') + '><span>Ativar carregamento IA</span></label>';

  const progressOuter = document.createElement('div');
  progressOuter.className = 'w-full bg-slate-200 dark:bg-slate-600 rounded h-3 overflow-hidden mt-3';
  const progressInner = document.createElement('div');
  progressInner.className = 'bg-indigo-500 h-3';
  progressInner.style.width = '0%';
  progressInner.style.transition = 'width 200ms linear';
  progressOuter.appendChild(progressInner);

  card.appendChild(top);
  card.appendChild(toggleWrap);
  if(iaEnabled) card.appendChild(progressOuter);
  try{ container.innerHTML = ''; container.appendChild(card); }catch(_){ }

  window.__webllm_progress_element = progressInner;
  window.__webllm_progress_label = top.querySelector('.webllm-status-container');

  const iaCheckbox = card.querySelector('.ia-toggle');
  iaCheckbox && iaCheckbox.addEventListener('change', (e)=>{
    const on = !!e.target.checked;
    localStorage.setItem('modulista.iaEnabled', on ? 'true' : 'false');
    if(on){
      // user enabled IA -> start loader
      startModelLoader();
    }else{
      // user disabled IA -> mark flag (cannot reliably abort dynamic import)
      try{ window.__webllm_progress_label && (window.__webllm_progress_label.textContent = 'Carregamento desativado'); }catch(_){ }
      window.__webllm_disabled = true;
    }
  });

  if(!iaEnabled) return;

  const modelName = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
  window.__webllm_model_name = modelName;
  const _modelNameEl = top.querySelector('.webllm-model-name');
  if(_modelNameEl) _modelNameEl.textContent = modelName;

  const url = 'https://esm.run/@mlc-ai/web-llm';
  window.webModelLoadPromise = (async ()=>{
    try{
      const mod = await import(/* @vite-ignore */ url);

      const initProgressCallback = (p)=>{
        try{
          const prog = (p && typeof p.progress === 'number') ? Number(p.progress) : null;
          if(window.__webllm_progress_element && prog !== null){
            try{
              const pct = Math.max(0, Math.min(1, prog)) * 100;
              window.__webllm_progress_element.style.width = pct + '%';
              const lbl = window.__webllm_progress_label;
              if(lbl){
                const statusEl = lbl.querySelector('.webllm-status-text');
                const modelEl = lbl.querySelector('.webllm-model-name');
                if(statusEl){
                  const parts = [ 'Carregando modelo... ' + Math.round(pct) + '%' ];
                  if(p && (p.timeElapsed !== undefined && p.timeElapsed !== null)) parts.push('tempo: ' + String(p.timeElapsed));
                  if(p && p.text) parts.push(String(p.text));
                  statusEl.textContent = parts.join(' • ');
                }
                if(modelEl && modelName) modelEl.textContent = modelName;
              }
            }catch(_){ }
          }
        }catch(_){ }
      };

      if(!window._webllm_engine){
        if(typeof mod.CreateMLCEngine === 'function'){
          window._webllm_engine = await mod.CreateMLCEngine(modelName, { initProgressCallback });
        }else if(typeof mod.MLCEngine === 'function'){
          const engineInst = new mod.MLCEngine({ initProgressCallback });
          await engineInst.reload(modelName);
          window._webllm_engine = engineInst;
        }else if(mod.default){
          const d = mod.default;
          if(typeof d.CreateMLCEngine === 'function'){
            window._webllm_engine = await d.CreateMLCEngine(modelName, { initProgressCallback });
          }else if(typeof d.MLCEngine === 'function'){
            const engineInst = new d.MLCEngine({ initProgressCallback });
            await engineInst.reload(modelName);
            window._webllm_engine = engineInst;
          }else{
            throw new Error('API do web-llm incompatível');
          }
        }else{
          throw new Error('API do web-llm não encontrada');
        }
      }

      window.webModelReady = true;
      return { name: modelName };
    }catch(err){
      console.error('Falha ao carregar modelo web-llm', err);
      try{ if(window.__webllm_progress_label) window.__webllm_progress_label.textContent = 'Falha ao carregar modelo'; }catch(_){ }
      throw err;
    }
  })();

  return window.webModelLoadPromise;
}

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
