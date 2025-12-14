import { store } from './store.js';
import { components } from './components.js';
import { modal } from './modal.js';
import { generateId } from './utils.js';

export const router = {
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

    if (item.type === 'lista') {
      this.renderListPage(main, item);
    } else if (item.type === 'funcao') {
      this.renderFunctionPage(main, item);
    } else if (item.type === 'aplicacao') {
      this.renderApplicationPage(main, item);
    } else {
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
          const card = components.createCard(item, () => {
            store.remove(list.id, item.id);
            const currentId = this.history[this.history.length - 1];
            this.render(currentId);
          });
          grid.appendChild(card);
        }
      });
      container.appendChild(grid);
    }

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

    if (!func.paramsId) {
      const paramsList = { id: generateId(), type: 'lista', items: [] };
      store.items[paramsList.id] = paramsList;
      func.paramsId = paramsList.id;
      store.save();
    }

    const paramsList = store.get(func.paramsId);
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
