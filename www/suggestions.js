import { commands } from './ui.js';

// Módulo responsável por gerar sugestões usando WebLLM
export async function generateSuggestion(kind, current, content = '', mime = '', listing = ''){
  // Limitar o conteúdo incluído no prompt para evitar payloads enormes
  const contentSnippet = (content || '').slice(0, 4000);
  const listingSnippet = (listing || '').slice(0, 2000);
  const mimePart = mime ? `Tipo MIME: ${mime}\n` : '';
  const listingPart = listingSnippet ? `Conteúdo da pasta (nomes): ${listingSnippet}\n\n` : '';
  const prompt = `${contentSnippet ? 'Conteúdo do arquivo (trecho):\n' + contentSnippet + '\n\n' : ''}${mimePart}${listingPart}Sugira um nome curto e descritivo para ${kind === 'file' ? 'o arquivo' : 'a pasta'} com nome atual "${current}". Retorne apenas o nome sugerido, sem explicações.`;
  try{
    const url = 'https://esm.run/@mlc-ai/web-llm';
    let mod;
    try{
      mod = await import(/* @vite-ignore */ url);
    }catch(err){
      console.error('Falha ao importar web-llm', err);
      throw new Error('Falha ao importar web-llm: ' + (err && err.message));
    }

    const modelName = 'Llama-3.2-3B-Instruct-q4f32_1-MLC';
    try{ window.__webllm_model_name = modelName; }catch(_){ }

    // Cache do engine na janela para evitar recarregar sempre
    if(!window._webllm_engine){
      const initProgressCallback = (p)=>{
        try{
          const prog = (p && typeof p.progress === 'number') ? Number(p.progress) : null;
          if(window.__webllm_progress_element && prog !== null){
            try{
              const pct = Math.max(0, Math.min(1, prog)) * 100;
              window.__webllm_progress_element.style.width = pct + '%';
              const lbl = window.__webllm_progress_label;
              if(lbl){
                const text = (p && typeof p.text === 'string') ? p.text : 'Sugerindo com IA...';
                const time = (p && (typeof p.timeElapsed !== 'undefined')) ? String(p.timeElapsed) : '';
                const statusEl = lbl.querySelector('.webllm-status-text');
                const modelEl = lbl.querySelector('.webllm-model-name');
                if(statusEl) statusEl.textContent = (text || '') + (time ? ' — ' + time : '') + ' ' + Math.round(pct) + '%';
                if(modelEl && modelName) modelEl.textContent = modelName;
              }
            }catch(_){ }
          }
        }catch(_){ }
        console.debug && console.debug('webllm load progress', p);
      };
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

    const engine = window._webllm_engine;
    const messages = [
      { role: 'system', content: 'Você é um assistente que sugere nomes curtos para arquivos e pastas. Responda apenas com o nome sugerido, sem pontuação extra.' },
      { role: 'user', content: prompt }
    ];

    const temperature = 0.2;
    const max_tokens = 64;
    try{
        if(commands){
          const detailItem = document.createElement('div');
          detailItem.className = 'p-2 bg-slate-50 dark:bg-slate-700 rounded shadow text-sm text-slate-700 dark:text-slate-100';
          const header = document.createElement('div');
          header.className = 'flex items-center gap-2 mb-1';
          header.innerHTML = '<span class="material-symbols-outlined mr-2">description</span><strong>Detalhes da solicitação</strong>';

          const form = document.createElement('div');
          form.className = 'grid grid-cols-1 gap-2';

          const makeRow = (labelText, el) => {
            const wrap = document.createElement('div');
            wrap.className = 'flex flex-col';
            const lbl = document.createElement('label');
            lbl.className = 'text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1';
            lbl.textContent = labelText;
            wrap.appendChild(lbl);
            wrap.appendChild(el);
            return wrap;
          };

          const tempInput = document.createElement('input');
          tempInput.className = 'text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 w-full';
          tempInput.type = 'text';
          tempInput.value = String(temperature);
          tempInput.readOnly = true;

          const maxInput = document.createElement('input');
          maxInput.className = tempInput.className;
          maxInput.type = 'text';
          maxInput.value = String(max_tokens);
          maxInput.readOnly = true;

          const systemTextarea = document.createElement('textarea');
          systemTextarea.className = 'whitespace-pre-wrap text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto';
          systemTextarea.rows = 3;
          systemTextarea.readOnly = true;

          const userTextarea = document.createElement('textarea');
          userTextarea.className = systemTextarea.className;
          userTextarea.rows = 3;
          userTextarea.readOnly = true;

          try{
            const systemMsg = messages.find(m => m.role === 'system')?.content || '(sem mensagem)';
            const userMsg = messages.find(m => m.role === 'user')?.content || '(sem mensagem)';
            systemTextarea.value = systemMsg.length > 800 ? systemMsg.slice(0,800) + '\n... (truncado)' : systemMsg;
            userTextarea.value = userMsg.length > 800 ? userMsg.slice(0,800) + '\n... (truncado)' : userMsg;
          }catch(_){
            systemTextarea.value = '(não pôde serializar)';
            userTextarea.value = '(não pôde serializar)';
          }

          form.appendChild(makeRow('temperature', tempInput));
          form.appendChild(makeRow('max_tokens', maxInput));
          form.appendChild(makeRow('Mensagem do sistema', systemTextarea));
          form.appendChild(makeRow('Mensagem do usuário', userTextarea));

          detailItem.appendChild(header);
          detailItem.appendChild(form);
          commands.appendChild(detailItem);
        }
    }catch(_){ }

    const resp = await engine.chat.completions.create({ messages, temperature, max_tokens });
    const text = resp?.choices?.[0]?.message?.content || '';
    try{
      if(commands){
        const resultItem = document.createElement('div');
        resultItem.className = 'p-2 bg-slate-50 dark:bg-slate-700 rounded shadow text-sm text-slate-700 dark:text-slate-100';
        const header = document.createElement('div');
        header.className = 'flex items-center gap-2 mb-1';
        header.innerHTML = '<span class="material-symbols-outlined mr-2">smart_toy</span><strong>Resposta</strong>';
        const body = document.createElement('div');
        body.className = 'whitespace-pre-wrap text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 overflow-auto';
        body.style.maxHeight = '6rem';
        body.textContent = (text || '').length > 800 ? (text || '').slice(0,800) + '\n... (truncado)' : (text || '');
        resultItem.appendChild(header);
        resultItem.appendChild(body);
        commands.appendChild(resultItem);
      }
    }catch(_){ }
    return (text || '').toString().trim();
  }catch(e){
    console.error('generateSuggestion: erro usando webllm', e);
    try{
      let base = (current || '').replace(/\.[^/.]+$/, '');
      base = base.replace(/[_-]+/g, ' ').trim();
      if(!base) base = kind === 'file' ? 'arquivo' : 'pasta';
      return (base + (base.toLowerCase().includes('novo') ? '' : ' novo')).slice(0, 120);
    }catch(_){
      return current || '';
    }
  }
}

// Liga o event listener do botão de sugestão ao fluxo de geração.
export function attachSuggestHandler(button, selected, input){
  if(!button) return;
  button.addEventListener('click', async ()=>{
    const old = button.innerHTML;
    button.innerHTML = '<span class="material-symbols-outlined">hourglass_top</span>';
    button.disabled = true;
    // Inserir item de comando com barra de progresso
    let cmdItem;
    try{
      if(commands){
        cmdItem = document.createElement('div');
        cmdItem.className = 'p-2 bg-slate-50 dark:bg-slate-700 rounded shadow flex flex-col space-y-2';
        const label = document.createElement('div');
        label.className = 'text-sm text-slate-700 dark:text-slate-100 flex flex-col gap-1';
        const topRow = document.createElement('div');
        topRow.className = 'flex items-center gap-2';
        topRow.innerHTML = '<span class="material-symbols-outlined mr-2">smart_toy</span><span class="webllm-status-text">Sugerindo com IA...</span>';
        const modelField = document.createElement('div');
        modelField.className = 'webllm-model-name text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-full truncate';
        modelField.textContent = window.__webllm_model_name || '';
        label.appendChild(topRow);
        label.appendChild(modelField);
        const progressOuter = document.createElement('div');
        progressOuter.className = 'w-full bg-slate-200 dark:bg-slate-600 rounded h-3 overflow-hidden';
        const progressInner = document.createElement('div');
        progressInner.className = 'bg-indigo-500 h-3';
        progressInner.style.width = '0%';
        progressInner.style.transition = 'width 200ms linear';
        progressOuter.appendChild(progressInner);
        cmdItem.appendChild(label);
        cmdItem.appendChild(progressOuter);
        commands.appendChild(cmdItem);
        // Expor o elemento para que o callback de init possa atualizá-lo
        try{ window.__webllm_progress_element = progressInner; window.__webllm_progress_label = label; }catch(_){ }
      }
    }catch(e){
      console.error('Erro ao inserir item de comando:', e);
    }
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

      const suggestion = await generateSuggestion(selected ? selected.kind : 'file', input ? input.value || '' : '', fileContent, mimeType, listing);
      if(suggestion && input) input.value = suggestion;
    }catch(e){
      alert('Erro ao gerar sugestão: ' + (e && e.message));
    }finally{
      button.disabled = false;
      button.innerHTML = old;
      // manter o elemento de progresso na coluna de comandos após conclusão
    }
  });
}
