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

export async function moveToExisting(){
  const selected = getSelected();
  if(!selected) return alert('Nenhum item selecionado');
  if(!selected.parent) return alert('Mover a raiz não é suportado.');

  const prev = document.getElementById('move-existing-form'); if(prev) prev.remove();
  try{ enterCommandDetailMode(document.getElementById('moveExistingBtn')); }catch(_){ }

  const form = document.createElement('div');
  form.id = 'move-existing-form';
  form.className = 'mt-2 flex flex-col space-y-2';

  const contentArea = document.createElement('div');
  contentArea.className = 'mt-2';
  form.appendChild(contentArea);
  if(commands) commands.appendChild(form);

  const cleanup = ()=>{ try{ exitCommandDetailMode(); }catch(_){ const el = document.getElementById('move-existing-form'); if(el) el.remove(); } };

  try{
    contentArea.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'mt-2';
    contentArea.appendChild(container);

    if(selected && selected.parent){
      const dirs = [];
      for await (const [name, handle] of selected.parent.entries()){
        try{ if(handle && handle.kind === 'directory') dirs.push(name); }catch(_){ }
        if(dirs.length >= 500) break;
      }
      dirs.sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
      if(dirs.length === 0){
        const empty = document.createElement('div'); empty.className = 'text-sm text-slate-500'; empty.textContent = 'Nenhuma subpasta encontrada.'; container.appendChild(empty);
      } else {
        const select = document.createElement('select');
        select.className = 'w-full px-3 py-2 rounded border bg-white dark:bg-slate-800';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '-- Selecionar subpasta --';
        placeholder.selected = true;
        placeholder.disabled = true;
        select.appendChild(placeholder);
        for(const name of dirs){
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          select.appendChild(opt);
        }
        const row = document.createElement('div');
        row.className = 'mt-2 flex items-center gap-2';
        select.className = 'flex-1 px-3 py-2 rounded border bg-white dark:bg-slate-800';
        row.appendChild(select);

        const moveBtn = document.createElement('button');
        moveBtn.type = 'button';
        moveBtn.className = 'inline-flex items-center justify-center p-2 bg-indigo-600 text-white rounded disabled:opacity-50';
        moveBtn.title = 'Mover';
        moveBtn.disabled = true;
        const moveIcon = document.createElement('span');
        moveIcon.className = 'material-symbols-outlined text-[18px]';
        moveIcon.setAttribute('aria-hidden','true');
        moveIcon.textContent = 'drive_file_move';
        moveBtn.appendChild(moveIcon);
        row.appendChild(moveBtn);
        container.appendChild(row);

        select.addEventListener('change', ()=>{ moveBtn.disabled = !select.value; });

        // Se o modelo IA estiver pronto (ou terminar de carregar), solicitar sugestão de ordem
        const trySuggestOrder = async ()=>{
          let progressCard;
          try{ progressCard = createCommandProgress(); }catch(_){ }
          try{
            // preparar contexto: lista de itens da pasta atual (se selecionado for pasta, listar seu conteúdo)
            let listingNames = '';
            try{
              if(selected && selected.kind === 'directory' && selected.parent){
                const dirHandle = await selected.parent.getDirectoryHandle(selected.name);
                const names = [];
                for await (const [n, h] of dirHandle.entries()){
                  names.push(n);
                  if(names.length >= 200) break;
                }
                listingNames = names.join(', ');
              } else if(selected && selected.parent){
                // selecionado é arquivo -> contexto é a pasta que contém o arquivo
                const names = [];
                for await (const [n, h] of selected.parent.entries()){
                  names.push(n);
                  if(names.length >= 200) break;
                }
                listingNames = names.join(', ');
              } else {
                listingNames = dirs.slice(0,200).join(', ');
              }
            }catch(_){ listingNames = dirs.slice(0,200).join(', '); }

            const parentSubfolders = dirs.slice(0,200);
            const promptBody = JSON.stringify({
              parentSubfolders,
              itemName: selected ? selected.name : '',
            });
            const systemMsg = 'Você é um organizador de arquivos. O usuário fornecerá um nome de arquivo e uma lista de pastas. Sua tarefa é retornar as pastas que mais combinam com o arquivo, por ordem de relevância, em formato JSON. A resposta deve ser apenas um JSON contendo um array de strings (ex: ["Pasta A","Outra Pasta"]) e não deve incluir explicações ou texto adicional. Use exatamente os nomes fornecidos.';
            const messages = [
              { role: 'system', content: systemMsg },
              { role: 'user', content: promptBody }
            ];
            const suggestionText = await generateSuggestion(messages);
            if(suggestionText){
              // parsear resposta em array
              const parts = suggestionText.split(/[,\n]+/).map(s=>s.trim()).filter(Boolean);
              // criar novo dropdown apenas se houver pelo menos 1 sugestão
              if(parts.length){
                const aiLabel = document.createElement('div');
                aiLabel.className = 'text-xs text-slate-500 mt-2';
                aiLabel.textContent = 'Sugestão da IA (mais provável → menos provável):';
                const aiSelect = document.createElement('select');
                aiSelect.className = 'w-full px-3 py-2 rounded border bg-white dark:bg-slate-800 mt-1';
                const aiPlaceholder = document.createElement('option'); aiPlaceholder.value = ''; aiPlaceholder.textContent = '-- Selecionar a sugestão da IA --'; aiPlaceholder.selected = true; aiPlaceholder.disabled = true; aiSelect.appendChild(aiPlaceholder);
                // inserir opções na ordem sugerida; filtrar nomes não existentes e evitar duplicatas
                const seen = new Set();
                for(const name of parts){
                  if(!name) continue;
                  // tentar corresponder ao nome exatamente; se não encontrado, tentar correspondência ignorando diacríticos/case
                  const match = dirs.find(d => d === name) || dirs.find(d => d.toLowerCase() === name.toLowerCase());
                  if(match && !seen.has(match)){
                    const opt = document.createElement('option'); opt.value = match; opt.textContent = match; aiSelect.appendChild(opt); seen.add(match);
                  }
                }
                // adicionar quaisquer restantes que não apareceram na sugestão ao final, na ordem original
                for(const name of dirs){ if(!seen.has(name)){ const opt = document.createElement('option'); opt.value = name; opt.textContent = name; aiSelect.appendChild(opt); } }

                // ao escolher a sugestão da IA, sincronizar o select principal
                aiSelect.addEventListener('change', ()=>{ if(aiSelect.value) select.value = aiSelect.value; select.dispatchEvent(new Event('change')); });

                // inserir o novo dropdown abaixo do existente
                const suggestionRow = document.createElement('div'); suggestionRow.className = 'mt-2';
                suggestionRow.appendChild(aiLabel);
                suggestionRow.appendChild(aiSelect);
                commands.appendChild(suggestionRow);
              }
            }
          }catch(_){ /* silencioso */ }
          try{ progressCard && progressCard.remove && progressCard.remove(); }catch(_){ }
        };

        if(window.webModelReady){ trySuggestOrder().catch(()=>{}); }
        else if(window.webModelLoadPromise){ window.webModelLoadPromise.then(()=>{ trySuggestOrder().catch(()=>{}); }).catch(()=>{}); }

        moveBtn.addEventListener('click', async ()=>{
          try{
            const name = select.value;
            if(!name) return alert('Selecione uma subpasta.');
            const targetDir = await selected.parent.getDirectoryHandle(name);
            const okPerm = await ensureHandlePermission(targetDir, 'readwrite').catch(()=>false);
            if(!okPerm) return alert('Permissão negada para a pasta de destino.');
            await performMove(selected, targetDir);
            setSelected(null);
            cleanup();
            return true;
          }catch(e){ alert('Falha ao mover: ' + (e && e.message)); }
        });
      }
    }
  }catch(e){ alert('Erro ao listar subpastas: ' + (e && e.message)); }

  return true;
}
