// Detecta o tema preferido do navegador e aplica a classe `dark` no root.
const prefersDarkMedia = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(isDark){
  if(isDark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

// Aplica imediatamente com o valor atual
applyTheme(prefersDarkMedia ? prefersDarkMedia.matches : false);

// Escuta mudanças de preferência
if(prefersDarkMedia){
  if(typeof prefersDarkMedia.addEventListener === 'function'){
    prefersDarkMedia.addEventListener('change', e => applyTheme(e.matches));
  } else if(typeof prefersDarkMedia.addListener === 'function'){
    prefersDarkMedia.addListener(e => applyTheme(e.matches));
  }
}

export {};
