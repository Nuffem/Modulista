import { store } from './store.js';
import { router } from './router.js';

export const components = {
  createCard(item, onDelete) {
    const card = document.createElement('div');
    card.className = 'item-card fade-in';

    const header = document.createElement('div');
    header.className = 'item-header';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'item-type';
    typeBadge.textContent = item.type;
    header.appendChild(typeBadge);

    if (onDelete) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'icon-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.style.fontSize = '1.5rem';
      deleteBtn.style.padding = '0';
      deleteBtn.style.width = '24px';
      deleteBtn.style.height = '24px';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja remover este item?')) {
          onDelete();
        }
      };
      header.appendChild(deleteBtn);
    }

    card.appendChild(header);

    const content = document.createElement('div');
    content.className = 'item-content';

    switch (item.type) {
      case 'logico':
        content.appendChild(this.createToggle(item));
        break;
      case 'numero':
        content.appendChild(this.createNumberInput(item));
        break;
      case 'texto':
        content.appendChild(this.createTextInput(item));
        break;
      case 'lista':
      case 'funcao':
      case 'aplicacao':
        content.innerHTML = `<button class="btn">Abrir ${item.type}</button>`;
        content.querySelector('button').onclick = () => router.navigateTo(item.id);
        break;
      case 'valor':
        content.appendChild(this.createValueInput(item));
        break;
    }

    card.appendChild(content);
    return card;
  },

  createToggle(item) {
    const wrapper = document.createElement('label');
    wrapper.className = 'toggle-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'toggle-input';
    input.checked = item.value || false;
    input.onchange = (e) => store.update(item.id, { value: e.target.checked });

    const slider = document.createElement('div');
    slider.className = 'toggle-slider';

    const label = document.createElement('span');
    label.textContent = item.value ? 'Verdadeiro' : 'Falso';
    input.addEventListener('change', () => {
      label.textContent = input.checked ? 'Verdadeiro' : 'Falso';
    });

    wrapper.appendChild(input);
    wrapper.appendChild(slider);
    wrapper.appendChild(label);
    return wrapper;
  },

  createNumberInput(item) {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = item.value || 0;
    input.oninput = (e) => store.update(item.id, { value: parseFloat(e.target.value) });
    return input;
  },

  createTextInput(item) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = item.value || '';
    input.placeholder = 'Digite um texto...';
    input.oninput = (e) => store.update(item.id, { value: e.target.value });
    return input;
  },

  createValueInput(item) {
    const wrapper = document.createElement('div');

    const select = document.createElement('select');
    ['texto', 'numero', 'logico'].forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (item.selectedType === t) opt.selected = true;
      select.appendChild(opt);
    });

    const valContainer = document.createElement('div');
    valContainer.style.marginTop = '0.5rem';

    const renderInput = () => {
      valContainer.innerHTML = '';
      const type = select.value;
      let input;
      if (type === 'texto') {
        input = document.createElement('input');
        input.type = 'text';
        input.value = item.value || '';
        input.oninput = (e) => store.update(item.id, { selectedType: type, value: e.target.value });
      } else if (type === 'numero') {
        input = document.createElement('input');
        input.type = 'number';
        input.value = item.value || 0;
        input.oninput = (e) => store.update(item.id, { selectedType: type, value: parseFloat(e.target.value) });
      } else if (type === 'logico') {
        const label = document.createElement('label');
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = item.value === true;
        chk.onchange = (e) => store.update(item.id, { selectedType: type, value: e.target.checked });
        label.appendChild(chk);
        label.append(" Verdadeiro/Falso");
        label.style.color = 'var(--text-secondary)';
        input = label;
      }
      valContainer.appendChild(input);
    };

    select.onchange = (e) => {
      store.update(item.id, { selectedType: e.target.value, value: null });
      renderInput();
    };

    renderInput();

    wrapper.appendChild(select);
    wrapper.appendChild(valContainer);
    return wrapper;
  }
};
