import { commands, createCommandProgress, enterCommandDetailMode, exitCommandDetailMode } from '../ui.js';
import { getSelected, setSelected, ensureHandlePermission } from '../state.js';
import { generateSuggestion } from '../suggestions.js';
import { copyDirectory } from '../commands.js';

async function performMove(selectedItem, targetDir){
  if(!selectedItem) throw new Error('Nenhum item selecionado');
  if(selectedItem.kind === 'file'){
    const oldHandle = selectedItem.handle;
    const file = await oldHandle.getFile();
    const newHandle = await targetDir.getFileHandle(selectedItem.name, {create:true});
    const writable = await newHandle.createWritable();
    await writable.write(await file.arrayBuffer());
    await writable.close();
    await selectedItem.parent.removeEntry(selectedItem.name);
  } else {
    const source = await selectedItem.parent.getDirectoryHandle(selectedItem.name);
    const tgt = await targetDir.getDirectoryHandle(selectedItem.name, {create:true});
    await copyDirectory(source, tgt);
    await selectedItem.parent.removeEntry(selectedItem.name, {recursive: true});
  }
}

export async function moveToNew(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent) return alert('Mover a raiz não é suportado.');

  const prev = document.getElementById('move-new-form'); if(prev) prev.remove();
  try{ enterCommandDetailMode(document.getElementById('moveNewBtn')); }catch(_){ }

  const form = document.createElement('div');
  form.id = 'move-new-form';
  form.className = 'mt-2 flex flex-col space-y-2';

  const contentArea = document.createElement('div');
  contentArea.className = 'mt-2';
  form.appendChild(contentArea);
  if(commands) commands.appendChild(form);

  const cleanup = ()=>{ try{ exitCommandDetailMode(); }catch(_){ const el = document.getElementById('move-new-form'); if(el) el.remove(); } };

  try{
    contentArea.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'mt-2 flex items-center space-x-2';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Nome da nova subpasta';
    input.className = 'flex-1 border rounded p-1 bg-white text-slate-900 placeholder-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 focus:outline-none';
    row.appendChild(input);

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'p-2 bg-green-600 hover:bg-green-700 text-white rounded focus:outline-none';
    confirm.setAttribute('aria-label', 'Confirmar');
    confirm.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>';
    row.appendChild(confirm);

    contentArea.appendChild(row);

    confirm.addEventListener('click', async ()=>{
      const name = (input.value || '').trim();
      if(!name){ alert('Informe o nome da nova subpasta.'); return; }
      try{
        if(!selected || !selected.parent) return alert('Nenhum item selecionado ou pasta pai inválida.');
        const targetDir = await selected.parent.getDirectoryHandle(name, {create:true});
        const okPerm = await ensureHandlePermission(targetDir, 'readwrite').catch(()=>false);
        if(!okPerm) return alert('Permissão negada para a pasta de destino.');
        await performMove(selected, targetDir);
        setSelected(null);
        cleanup();
        return true;
      }catch(e){ alert('Falha ao mover: ' + (e && e.message)); }
    });

    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') confirm.click(); });

    input.focus();

    // Se o modelo IA estiver pronto (ou terminar de carregar), solicitar sugestão automática
    const trySuggest = async ()=>{
      let progressCard;
      try{ progressCard = createCommandProgress(); }catch(_){ }
      try{
        let fileContent = '';
        let mimeType = '';
        let listing = '';
        // Se selecionado for arquivo, ler trecho; se for pasta, listar itens da pasta pai para contexto
        if(selected && selected.kind === 'file' && selected.handle){
          try{
            const f = await selected.handle.getFile();
            mimeType = f.type || '';
            const allowedMimes = ['application/json','application/javascript','application/xml','text/html','text/markdown','text/plain','text/css'];
            const shouldRead = mimeType ? (mimeType.startsWith('text/') || allowedMimes.includes(mimeType)) : true;
            if(shouldRead){ fileContent = (await f.text()).slice(0, 20000); }
          }catch(_){ fileContent = ''; mimeType = ''; }
        } else if(selected && selected.parent){
          try{
            const names = [];
            for await (const [name, handle] of selected.parent.entries()){
              names.push(name);
              if(names.length >= 200) break;
            }
            listing = names.join(', ');
          }catch(_){ listing = ''; }
        }

        const promptBody = `${fileContent ? 'Conteúdo do arquivo (trecho):\n' + fileContent.slice(0,2000) + '\n\n' : ''}Sugira um nome curto e descritivo para a nova subpasta que receberá ${selected && selected.kind === 'file' ? "o arquivo" : "a pasta"} com nome atual \"${selected ? selected.name : ''}\". Retorne apenas o nome sugerido, sem explicações.`;
        const systemMsg = 'Você é um assistente que sugere nomes curtos para pastas. Responda apenas com o nome sugerido, sem pontuação extra.';

        const suggestion = await generateSuggestion(selected ? selected.kind : 'file', selected ? selected.name || '' : '', fileContent, mimeType, listing, 'name', '', systemMsg, promptBody);
        if(suggestion && input) input.value = suggestion;
      }catch(_){ /* falha silenciosa */ }
      try{ progressCard && progressCard.remove && progressCard.remove(); }catch(_){ }
    };

    if(window.webModelReady){
      trySuggest().catch(()=>{});
    } else if(window.webModelLoadPromise){
      window.webModelLoadPromise.then(()=>{ trySuggest().catch(()=>{}); }).catch(()=>{});
    }
  }catch(e){ alert('Erro ao criar nova subpasta: ' + (e && e.message)); }

  return true;
}
