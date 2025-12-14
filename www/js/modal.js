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
    const grid = document.createElement('div');
    grid.className = 'type-grid';

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
      btn.onclick = () => this.createItem(t.id);
      grid.appendChild(btn);
    });

    this.body.appendChild(grid);
  },

  createItem(type) {
    const newItem = {
      id: generateId(),
      type: type
    };

    if (type === 'lista') newItem.items = [];
    if (type === 'funcao') {
      const pList = { id: generateId(), type: 'lista', items: [] };
      store.items[pList.id] = pList;
      newItem.paramsId = pList.id;

      const rVal = { id: generateId(), type: 'valor', selectedType: 'numero', value: 0 };
      store.items[rVal.id] = rVal;
      newItem.returnId = rVal.id;
    }
    if (type === 'aplicacao') {
      const aList = { id: generateId(), type: 'lista', items: [] };
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
