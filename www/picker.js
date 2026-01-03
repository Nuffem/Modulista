import { pickerView, mainView } from './ui.js';
import { getRootHandle } from './state.js';

// Navigate using History API while keeping a hash-based URL for compatibility.
export function setHash(path, { replace = false, state = null } = {}){
  // normalize path (allow '/pasta' or 'pasta') and collapse duplicate slashes
  let p = path === '' ? '/' : (path.startsWith('/') ? path : ('/' + path));
  p = p.replace(/\/\/+/g, '/');
  if(!p.startsWith('/')) p = '/' + p;
  const hash = '#' + p;
  const url = location.pathname + location.search + hash;
  try{
    if(replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);
  }catch(e){
    // fallback if pushState/replaceState not allowed
    if(replace) location.replace(url);
    else location.hash = p;
    return;
  }
  // update view immediately
  renderByHash();
}

export function renderByHash(){
  const h = location.hash.replace('#','');
  const path = h || '/';
  // if there's no root selected, always show picker
  if(!getRootHandle()){
    pickerView.classList.remove('hidden');
    mainView.classList.add('hidden');
    return;
  }
  // root exists -> show main view; content selection handled elsewhere
  pickerView.classList.add('hidden');
  mainView.classList.remove('hidden');
}

// Note: actual `popstate`/`hashchange` handling (including rendering tree) is
// performed in `modulista-main.js` to avoid duplicate tree renders.
