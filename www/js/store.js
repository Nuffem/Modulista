import { generateId } from './utils.js';

export const store = {
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

  remove(parentId, itemId) {
    const parent = this.get(parentId);
    if (parent && parent.items) {
      parent.items = parent.items.filter(id => id !== itemId);
      this.save();
    }
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
  },

  validateName(parentId, name, excludedItemId = null) {
    if (!name || name.trim() === '') return false;
    const parent = this.get(parentId);
    if (!parent || !parent.items) return true; // Should not happen for lists, but safe fallback

    // items is an array of IDs
    return !parent.items.some(id => {
      if (id === excludedItemId) return false;
      const item = this.get(id);
      return item && item.name === name;
    });
  }
};
