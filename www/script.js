
// State Management
const MIN_ID = 1000;
const generateId = () => 'id_' + Math.random().toString(36).substr(2, 9);

const store = {
  items: {},
  rootId: null,

  init() {
    const rootItem = {
      id: generateId(),
      type: 'lista',
      items: [] // Array of IDs
    };
    this.items[rootItem.id] = rootItem;
    this.rootId = rootItem.id;
    this.save();
  },

  get(id) {
    return this.items[id];
  },

  add(parentId, item) {
    this.items[item.id] = item;
    const parent = this.get(parentId);
    if (parent && parent.items) {
      parent.items.push(item.id);
    }
    this.save();
  },

  update(id, updates) {
    if (this.items[id]) {
      Object.assign(this.items[id], updates);
      this.save();
    }
  },

  save() {
    localStorage.setItem('modulista_state', JSON.stringify(this.items));
    localStorage.setItem('modulista_root', this.rootId);
  },

  load() {
    const storedItems = localStorage.getItem('modulista_state');
    const storedRoot = localStorage.getItem('modulista_root');
    if (storedItems && storedRoot) {
      this.items = JSON.parse(storedItems);
      this.rootId = storedRoot;
    } else {
      this.init();
    }
  }
};

// Router / Navigation module
const router = {
  history: [],

  init() {
    store.load();
    this.navigateTo(store.rootId);
  },

  navigateTo(id) {
    this.history.push(id);
    this.render(id);
    this.updateBreadcrumbs();
  },

  navigateBack(index) {
    if (index !== undefined) {
      this.history = this.history.slice(0, index + 1);
    } else {
      this.history.pop();
    }
    const currentId = this.history[this.history.length - 1];
    this.render(currentId);
    this.updateBreadcrumbs();
  },

  updateBreadcrumbs() {
    const nav = document.getElementById('breadcrumbs');
    nav.innerHTML = '';

    this.history.forEach((id, index) => {
      const item = store.get(id);
      const span = document.createElement('span');
      span.className = 'breadcrumb-item';

      let name = 'Início';
      if (index > 0) {
        // Try to find a name or use type
        name = `${item.type} #${id.substr(0, 4)}`;
      }

      span.textContent = name;
      span.onclick = () => this.navigateBack(index);

      nav.appendChild(span);

      if (index < this.history.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'breadcrumb-separator';
        sep.textContent = '/';
        nav.appendChild(sep);
      }
    });
  },

  render(id) {
    const main = document.getElementById('main-content');
    main.innerHTML = '';

    const item = store.get(id);
    if (!item) return;

    // Render based on type
    // Pages: Lista, Função, Aplicação
    // But also check if we are viewing a "Page" type.

    if (item.type === 'lista') {
      this.renderListPage(main, item);
    } else if (item.type === 'funcao') {
      this.renderFunctionPage(main, item);
    } else if (item.type === 'aplicacao') {
      this.renderApplicationPage(main, item);
    } else {
      // Fallback for unexpected direct navigation
      main.innerHTML = `<div class="empty-state">Visualização não suportada para ${item.type}</div>`;
    }
  },

  renderListPage(container, list) {
    const grid = document.createElement('div');
    grid.className = 'item-list';

    if (!list.items || list.items.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <h3>Lista Vazia</h3>
                    <p>Adicione novos itens para começar.</p>
                </div>
            `;
    } else {
      list.items.forEach(itemId => {
        const item = store.get(itemId);
        if (item) {
          const card = components.createCard(item);
          grid.appendChild(card);
        }
      });
      container.appendChild(grid);
    }

    // Add Button
    const btnContainer = document.createElement('div');
    btnContainer.className = 'add-btn-container';
    const addBtn = document.createElement('button');
    addBtn.className = 'btn btn-primary add-btn shadow-pulse';
    addBtn.innerHTML = '+';
    addBtn.onclick = () => modal.open(list.id);
    btnContainer.appendChild(addBtn);
    container.appendChild(btnContainer);
  },

  renderFunctionPage(container, func) {
    container.innerHTML = `<h2>Definição de Função</h2>`;

    const content = document.createElement('div');
    content.style.marginTop = '2rem';

    // Parameters Section
    const paramsHeader = document.createElement('h3');
    paramsHeader.textContent = "Parâmetros";
    paramsHeader.style.marginBottom = '1rem';
    content.appendChild(paramsHeader);

    const paramsContainer = document.createElement('div');
    paramsContainer.className = 'section-container';
    paramsContainer.style.border = '1px dashed var(--glass-border)';
    paramsContainer.style.padding = '1rem';
    paramsContainer.style.borderRadius = 'var(--radius-md)';

    // Find existing params list or create if missing (auto-heal)
    if (!func.paramsId) {
      const paramsList = { id: generateId(), type: 'lista', items: [] };
      store.items[paramsList.id] = paramsList;
      func.paramsId = paramsList.id;
      store.save();
    }

    // We can reuse renderListPage logic but typically we might want it inline. 
    // For simplicity, let's just render a link/button to edit params as a list, 
    // OR render the list here. Let's render the list here.
    // Actually renderListPage expects a container and appends add button fixated.
    // Let's manually render the list items here.

    const paramsList = store.get(func.paramsId);
    // Reuse renderListPage but we need to handle the Add button positioning differently 
    // or accept the fixed position behavior.
    // Let's just pass a sub-container.

    const pSub = document.createElement('div');
    this.renderListPage(pSub, paramsList);
    paramsContainer.appendChild(pSub);
    content.appendChild(paramsContainer);

    // Return Section
    const retHeader = document.createElement('h3');
    retHeader.textContent = "Retorno (Valor)";
    retHeader.style.marginTop = '2rem';
    retHeader.style.marginBottom = '1rem';
    content.appendChild(retHeader);

    const returnContainer = document.createElement('div');
    if (!func.returnId) {
      const retItem = { id: generateId(), type: 'valor', selectedType: 'numero', value: 0 };
      store.items[retItem.id] = retItem;
      func.returnId = retItem.id;
      store.save();
    }
    const retItem = store.get(func.returnId);
    returnContainer.appendChild(components.createCard(retItem));
    content.appendChild(returnContainer);

    container.appendChild(content);
  },

  renderApplicationPage(container, app) {
    container.innerHTML = `<h2>Aplicação de Função</h2>`;

    const content = document.createElement('div');
    content.style.marginTop = '2rem';

    // Function Reference
    const refLabel = document.createElement('label');
    refLabel.textContent = "Referência da Função (ID ou Nome)";
    const refInput = document.createElement('input');
    refInput.type = 'text';
    refInput.value = app.functionRef || '';
    refInput.oninput = (e) => store.update(app.id, { functionRef: e.target.value });

    content.appendChild(refLabel);
    content.appendChild(refInput);

    // Arguments
    const argsHeader = document.createElement('h3');
    argsHeader.textContent = "Argumentos";
    argsHeader.style.marginTop = '2rem';
    argsHeader.style.marginBottom = '1rem';
    content.appendChild(argsHeader);

    const argsContainer = document.createElement('div');
    argsContainer.style.border = '1px dashed var(--glass-border)';
    argsContainer.style.padding = '1rem';
    argsContainer.style.borderRadius = 'var(--radius-md)';

    if (!app.argsId) {
      const argsList = { id: generateId(), type: 'lista', items: [] };
      store.items[argsList.id] = argsList;
      app.argsId = argsList.id;
      store.save();
    }
    const argsList = store.get(app.argsId);
    const aSub = document.createElement('div');
    this.renderListPage(aSub, argsList);
    argsContainer.appendChild(aSub);

    content.appendChild(argsContainer);

    container.appendChild(content);
  }
};

// Component Factory
const components = {
  createCard(item) {
    const card = document.createElement('div');
    card.className = 'item-card fade-in';

    const header = document.createElement('div');
    header.className = 'item-header';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'item-type';
    typeBadge.textContent = item.type;
    header.appendChild(typeBadge);

    // Delete button (optional but good for UX)
    const delBtn = document.createElement('span');
    delBtn.innerHTML = '&times;';
    delBtn.style.cursor = 'pointer';
    delBtn.style.padding = '0 0.5rem';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm('Excluir este item?')) {
        // Remove logic is tricky with flat store, ideally we remove ref from parent
        // For now, just hide/reload. 
        // Need parent link or search. 
        // Let's skip delete for this iteration to keep it strict to prompt.
      }
    };
    // header.appendChild(delBtn); 

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
        // Reuse toggle logic roughly
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

// Modal Logic
const modal = {
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
      // Create sub-structures immediately
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
    // Re-render current page
    router.render(router.history[router.history.length - 1]);
  }
};


// Initialization
document.addEventListener('DOMContentLoaded', () => {
  modal.init();
  router.init();
});
