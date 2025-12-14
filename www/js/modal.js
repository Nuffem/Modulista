import { store } from './store.js';
import { generateId } from './utils.js';
import { router } from './router.js';

export const modal = {
  overlay: document.getElementById('modal-overlay'),
  body: document.getElementById('modal-body'),
  closeBtn: document.getElementById('modal-close'),
  currentParentId: null,

  init() {
    this.closeBtn.onclick = () => this.close();
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.close();
    };
  },

  open(parentId) {
    this.currentParentId = parentId;
    this.renderOptions();
    this.overlay.classList.remove('hidden');
  },

  close() {
    this.overlay.classList.add('hidden');
    this.currentParentId = null;
  },

  renderOptions() {
    this.body.innerHTML = '';

    // Name Input
    const nameGroup = document.createElement('div');
    nameGroup.className = 'input-group';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Nome do item';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.id = 'new-item-name';
    nameInput.placeholder = 'Digite o nome do item...';
    nameGroup.appendChild(nameLabel);
    nameGroup.appendChild(nameInput);
    this.body.appendChild(nameGroup);

    const grid = document.createElement('div');
    grid.className = 'type-grid';
    // Add margin to separate from input
    grid.style.marginTop = '1.5rem';

    const types = [
      { id: 'lista', label: 'Lista' },
      { id: 'logico', label: 'Lógico' },
      { id: 'numero', label: 'Número' },
      { id: 'texto', label: 'Texto' },
      { id: 'funcao', label: 'Função' },
      { id: 'aplicacao', label: 'Aplicação' },
      { id: 'valor', label: 'Valor' }
    ];

    types.forEach(t => {
      const btn = document.createElement('div');
      btn.className = 'type-option';
      btn.textContent = t.label;
      btn.onclick = () => {
        const name = nameInput.value.trim();
        if (!name) {
          alert('Por favor, defina um nome para o item.');
          nameInput.focus();
          return;
        }
        if (!store.validateName(this.currentParentId, name)) {
          alert('Já existe um item com este nome nesta página.');
          nameInput.focus();
          return;
        }
        this.createItem(t.id, name);
      };
      grid.appendChild(btn);
    });

    this.body.appendChild(grid);
    setTimeout(() => nameInput.focus(), 100);
  },

  createItem(type, name) {
    const newItem = {
      id: generateId(),
      type: type,
      name: name
    };

    if (type === 'lista') newItem.items = [];
    if (type === 'funcao') {
      const pList = { id: generateId(), type: 'lista', items: [], name: 'Parâmetros' };
      store.items[pList.id] = pList;
      newItem.paramsId = pList.id;

      const rVal = { id: generateId(), type: 'valor', selectedType: 'numero', value: 0, name: 'Retorno' };
      store.items[rVal.id] = rVal;
      newItem.returnId = rVal.id;
    }
    if (type === 'aplicacao') {
      const aList = { id: generateId(), type: 'lista', items: [], name: 'Argumentos' };
      store.items[aList.id] = aList;
      newItem.argsId = aList.id;
      newItem.functionRef = '';
    }
    if (type === 'valor') { newItem.selectedType = 'texto'; newItem.value = ''; }
    if (type === 'logico') newItem.value = false;
    if (type === 'numero') newItem.value = 0;
    if (type === 'texto') newItem.value = '';

    store.add(this.currentParentId, newItem);
    this.close();
    router.render(router.history[router.history.length - 1]);
  }
};
