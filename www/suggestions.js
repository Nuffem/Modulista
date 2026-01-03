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

    // Cache do engine na janela para evitar recarregar sempre
    if(!window._webllm_engine){
      const initProgressCallback = (p)=>{
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

    const resp = await engine.chat.completions.create({ messages, temperature: 0.2, max_tokens: 64 });
    const text = resp?.choices?.[0]?.message?.content || '';
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
    }
  });
}
