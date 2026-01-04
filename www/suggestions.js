import { commands, appendCommandDetail, appendCommandResult } from './ui.js';

// Módulo responsável por gerar sugestões usando WebLLM
export async function generateSuggestion(kind, current, content = '', mime = '', listing = '', mode = 'name', subfolders = '', systemMsgOverride = null, promptBodyOverride = null){
  // Limitar o conteúdo incluído no prompt para evitar payloads enormes
  const contentSnippet = (content || '').slice(0, 4000);
  const listingSnippet = (listing || '').slice(0, 2000);
  const mimePart = mime ? `Tipo MIME: ${mime}\n` : '';
  const listingPart = listingSnippet ? `Conteúdo da pasta (nomes): ${listingSnippet}\n\n` : '';
  // `systemMsgOverride` e `promptBodyOverride` devem ser obrigatórios e fornecidos
  if(typeof systemMsgOverride !== 'string' || typeof promptBodyOverride !== 'string'){
    throw new Error('generateSuggestion: systemMsg and promptBody are required');
  }
  const promptBody = promptBodyOverride;
  const prompt = `${contentSnippet ? 'Conteúdo do arquivo (trecho):\n' + contentSnippet + '\n\n' : ''}${mimePart}${listingPart}${promptBody}`;
  try{
    // registro de requisição atual para permitir cancelamento cooperativo
    const reqId = (window.__webllm_request_counter = (window.__webllm_request_counter || 0) + 1);
    try{ window.__webllm_cancel_requested = false; window.__webllm_current_request = reqId; }catch(_){ }
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
    const systemMsg = systemMsgOverride;

    const messages = [
      { role: 'system', content: systemMsg },
      { role: 'user', content: prompt }
    ];

    const temperature = 0.2;
    const max_tokens = 64;
    try{
        if(commands){
          const systemMsg = messages.find(m => m.role === 'system')?.content || '(sem mensagem)';
          const userMsg = messages.find(m => m.role === 'user')?.content || '(sem mensagem)';
          appendCommandDetail(systemMsg, userMsg, temperature, max_tokens);
        }
    }catch(_){ }
    // se um cancelamento foi solicitado antes de iniciar, abortar
    if(window.__webllm_cancel_requested) return '';

    // iniciar a chamada de completions; se a API suportar um signal ou método de cancelamento,
    // tentaremos abortar a seguir a partir de exitCommandDetailMode
    const resp = await engine.chat.completions.create({ messages, temperature, max_tokens });
    // se a requisição não for mais a atual, ignorar o resultado
    if(window.__webllm_current_request !== reqId || window.__webllm_cancel_requested) return '';
    const text = resp?.choices?.[0]?.message?.content || '';
    try{
      if(commands){
        appendCommandResult(text);
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