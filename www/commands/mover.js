import { commands, createCommandProgress } from '../ui.js';
import { getSelected, setSelected, ensureHandlePermission, getRootHandle } from '../state.js';
import { generateSuggestion } from '../suggestions.js';
import { copyDirectory, getDirByPath } from '../commands.js';

export async function moveSelected(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent){
    alert('Mover a raiz não é suportado.');
    return false;
  }

  const prev = document.getElementById('move-form');
  if(prev) prev.remove();

  const form = document.createElement('div');
  form.id = 'move-form';
  form.className = 'mt-2 flex items-center space-x-2';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Destino (ex: /pasta/receber)';
  input.className = 'border rounded p-1 flex-1 bg-white text-slate-900 placeholder-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'p-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-green-400';
  confirmBtn.setAttribute('title', 'Confirmar');
  confirmBtn.setAttribute('aria-label', 'Confirmar');
  confirmBtn.innerHTML = '<span class="material-symbols-outlined">check</span>';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'p-2 bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400';
  cancelBtn.setAttribute('title', 'Cancelar');
  cancelBtn.setAttribute('aria-label', 'Cancelar');
  cancelBtn.innerHTML = '<span class="material-symbols-outlined">close</span>';

  const suggestBtn = document.createElement('button');
  suggestBtn.type = 'button';
  suggestBtn.className = 'p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400';
  suggestBtn.setAttribute('title', 'Sugerir com IA');
  suggestBtn.setAttribute('aria-label', 'Sugerir com IA');
  suggestBtn.innerHTML = '<span class="material-symbols-outlined">smart_toy</span>';

  // Inicialmente desabilita o botão de sugestão até o modelo estar pronto
  const enableSuggest = ()=>{
    try{ suggestBtn.disabled = false; suggestBtn.classList.remove('opacity-50','cursor-not-allowed'); suggestBtn.removeAttribute('aria-disabled'); }catch(_){ }
  };
  if(!window.webModelReady){
    try{ suggestBtn.disabled = true; suggestBtn.classList.add('opacity-50','cursor-not-allowed'); suggestBtn.setAttribute('aria-disabled','true'); }catch(_){ }
    if(window.webModelLoadPromise) window.webModelLoadPromise.then(enableSuggest).catch(()=>{});
  }else{
    enableSuggest();
  }

  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.className = 'p-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400';
  upBtn.setAttribute('title', 'Um nível acima');
  upBtn.setAttribute('aria-label', 'Um nível acima');
  upBtn.innerHTML = '<span class="material-symbols-outlined">arrow_upward</span>';

  form.appendChild(input);
  form.appendChild(upBtn);
  form.appendChild(suggestBtn);
  form.appendChild(confirmBtn);
  form.appendChild(cancelBtn);

  if(commands) commands.appendChild(form);
  input.focus();

  const cleanup = ()=>{ const el = document.getElementById('move-form'); if(el) el.remove(); };

  cancelBtn.addEventListener('click', ()=>{ cleanup(); });
  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') confirmBtn.click(); if(e.key === 'Escape') cleanup(); });

  upBtn.addEventListener('click', ()=>{
    try{
      const path = (selected && selected.path) ? selected.path : '/';
      const parts = path.split('/').filter(Boolean);
      if(parts.length <= 1){
        input.value = '/';
      } else {
        const newParts = parts.slice(0, Math.max(0, parts.length - 2));
        input.value = newParts.length ? ('/' + newParts.join('/')) : '/';
      }
      input.focus();
    }catch(_){ input.value = '/'; }
  });

  confirmBtn.addEventListener('click', async ()=>{
    const destPath = (input.value || '').trim();
    if(!destPath){ alert('Informe o destino.'); return; }
    try{
      const root = getRootHandle();
      if(!root) return alert('Nenhuma pasta aberta.');
      const targetDir = await getDirByPath(root, destPath);
      if(!targetDir) return alert('Pasta de destino não encontrada: ' + destPath);
      const okPerm = await ensureHandlePermission(targetDir, 'readwrite').catch(()=>false);
      if(!okPerm) return alert('Permissão negada para a pasta de destino.');

      if(selected.kind === 'file'){
        const oldHandle = selected.handle;
        const file = await oldHandle.getFile();
        const newHandle = await targetDir.getFileHandle(selected.name, {create:true});
        const writable = await newHandle.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
        await selected.parent.removeEntry(selected.name);
      } else {
        const source = await selected.parent.getDirectoryHandle(selected.name);
        const tgt = await targetDir.getDirectoryHandle(selected.name, {create:true});
        await copyDirectory(source, tgt);
        await selected.parent.removeEntry(selected.name, {recursive: true});
      }

      setSelected(null);
      cleanup();
      return true;
    }catch(e){
      alert('Falha ao mover: ' + (e && e.message));
      return false;
    }
  });

  // Manipulador de sugestão específico para o comando "mover"
  suggestBtn.addEventListener('click', async ()=>{
    if(suggestBtn.disabled) return; // botão inativo enquanto modelo não estiver pronto
    const old = suggestBtn.innerHTML;
    suggestBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span>';
    suggestBtn.disabled = true;
    let progressCard;
    try{
      progressCard = createCommandProgress();
    }catch(e){ console.error('Erro ao criar cartão de progresso:', e); }

    try{
      let subfolders = '';
      let fileContent = '';
      let mimeType = '';
      try{
        if(selected && selected.parent){
          const dirs = [];
          for await (const [name, handle] of selected.parent.entries()){
            try{ if(handle && handle.kind === 'directory') dirs.push(name); }catch(_){ }
            if(dirs.length >= 500) break;
          }
          subfolders = dirs.join(', ');
        }
      }catch(e){ subfolders = ''; }

      try{
        if(selected && selected.kind === 'file' && selected.handle){
          try{
            const f = await selected.handle.getFile();
            mimeType = f.type || '';
            const allowedMimes = ['application/json','application/javascript','application/xml','text/html','text/markdown','text/plain','text/css'];
            const shouldRead = mimeType ? (mimeType.startsWith('text/') || allowedMimes.includes(mimeType)) : true;
            if(shouldRead){ fileContent = (await f.text()).slice(0, 20000); }
          }catch(_){ fileContent = ''; mimeType = ''; }
        }
      }catch(_){ fileContent = ''; mimeType = ''; }

      const itemName = selected ? selected.name : '';
      const snippetPart = fileContent ? `Conteúdo (trecho):\n${fileContent.slice(0,2000)}\n\n` : '';
      const promptBody = `${itemName ? 'Nome do item: ' + itemName + '\n\n' : ''}${snippetPart}Sugira o nome de uma subpasta ou destino curto para mover este item. Retorne apenas o NOME da subpasta (sem caminho) ou o NOME de uma nova pasta a ser criada, sem explicações ou pontuação extra.`;
      const subList = subfolders ? `Subpastas existentes: ${subfolders}\n\n` : '';
      const systemMsg = `${subList}Você é um assistente que sugere destinos para mover itens dentro de uma pasta. Prefira sugerir o nome de uma subpasta existente (retorne apenas o NOME da subpasta, sem caminho). Se não houver subpasta adequada, proponha um NOME para criar uma nova pasta. Responda somente com o nome sugerido, sem explicações, sem pontuação extra.`;

      const suggestion = await generateSuggestion(selected ? selected.kind : 'file', input ? input.value || '' : '', fileContent, mimeType, '', 'move', subfolders, systemMsg, promptBody);
      if(suggestion && input) input.value = suggestion;
    }catch(e){
      alert('Erro ao gerar sugestão: ' + (e && e.message));
    }finally{
      suggestBtn.disabled = false;
      suggestBtn.innerHTML = old;
    }
  });

  return true;
}
