import { pickerView, mainView } from './ui.js';

export function setHash(path){ location.hash = path; }

export function renderByHash(){
  const h = location.hash.replace('#','');
  if(!h || h === '/' ){
    pickerView.classList.remove('hidden');
    mainView.classList.add('hidden');
  } else {
    pickerView.classList.add('hidden');
    mainView.classList.remove('hidden');
  }
}

window.addEventListener('hashchange', renderByHash);
