import { commands, createCommandProgress } from '../ui.js';
import { getSelected, setSelected } from '../state.js';
import { generateSuggestion } from '../suggestions.js';
import { copyDirectory } from '../commands.js';

export async function renameSelected(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent){
    alert('Renomear a raiz não é suportado.');
    return false;
  }

  const prev = document.getElementById('rename-form');
  if(prev) prev.remove();

  const form = document.createElement('div');
  form.id = 'rename-form';
  form.className = 'mt-2 flex items-center space-x-2';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = selected.name;
  input.placeholder = 'Novo nome';
  input.className = 'border rounded p-1 flex-1 bg-white text-slate-900 placeholder-slate-400 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400';

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

  form.appendChild(input);
  form.appendChild(suggestBtn);
  form.appendChild(confirmBtn);
  form.appendChild(cancelBtn);

  if(commands) commands.appendChild(form);
  input.focus();
  input.select();

  const cleanup = ()=>{ const el = document.getElementById('rename-form'); if(el) el.remove(); };

  cancelBtn.addEventListener('click', ()=>{ cleanup(); });

  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') confirmBtn.click(); if(e.key === 'Escape') cleanup(); });

  confirmBtn.addEventListener('click', async ()=>{
    const newName = (input.value || '').trim();
    if(!newName || newName === selected.name){ cleanup(); return false; }
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
        const source = await selected.parent.getDirectoryHandle(selected.name);
        const target = await selected.parent.getDirectoryHandle(newName, {create:true});
        await copyDirectory(source, target);
        await selected.parent.removeEntry(selected.name, {recursive: true});
      }
      setSelected(null);
      cleanup();
      return true;
    }catch(e){
      alert('Falha ao renomear: ' + (e && e.message));
      return false;
    }
  });

  // Manipulador de sugestão específico para o comando "renomear"
  suggestBtn.addEventListener('click', async ()=>{
    const old = suggestBtn.innerHTML;
    suggestBtn.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span>';
    suggestBtn.disabled = true;
    let progressCard;
    try{ progressCard = createCommandProgress(); }catch(e){ console.error('Erro ao criar cartão de progresso:', e); }

    try{
      let fileContent = '';
      let mimeType = '';
      let listing = '';
      if(selected && selected.kind === 'file' && selected.handle){
        try{
          const f = await selected.handle.getFile();
          mimeType = f.type || '';
          const allowedMimes = ['application/json','application/javascript','application/xml','text/html','text/markdown','text/plain','text/css'];
          const shouldRead = mimeType ? (mimeType.startsWith('text/') || allowedMimes.includes(mimeType)) : true;
          if(shouldRead){
            fileContent = (await f.text()).slice(0, 20000);
          }
        }catch(e){
          fileContent = '';
          mimeType = '';
        }
      } else if(selected && selected.handle){
        try{
          const names = [];
          for await (const [name, handle] of selected.handle.entries()){
            names.push(name);
            if(names.length >= 200) break;
          }
          listing = names.join(', ');
        }catch(e){
          listing = '';
        }
      }

      const promptBody = `${fileContent ? 'Conteúdo do arquivo (trecho):\n' + fileContent.slice(0,2000) + '\n\n' : ''}Sugira um nome curto e descritivo para ${selected && selected.kind === 'file' ? 'o arquivo' : 'a pasta'} com nome atual "${selected ? selected.name : ''}". Retorne apenas o nome sugerido, sem explicações.`;
      const systemMsg = 'Você é um assistente que sugere nomes curtos para arquivos e pastas. Responda apenas com o nome sugerido, sem pontuação extra.';

      const suggestion = await generateSuggestion(selected ? selected.kind : 'file', input ? input.value || '' : '', fileContent, mimeType, listing, 'name', '', systemMsg, promptBody);
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
