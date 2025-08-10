import { describe, test, expect } from '@jest/globals';
import { createNewItem } from '../src/app.js';

describe('createNewItem', () => {
    test('should create a new item with an empty value', () => {
        const items = [];
        const newItem = createNewItem('/', items);
        expect(newItem.value).toBe('');
    });

    test('should create a new item with name "Item" if no other items exist', () => {
        const items = [];
        const newItem = createNewItem('/', items);
        expect(newItem.name).toBe('Item');
    });

    test('should create a new item with an incremented name', () => {
        const items = [{ name: 'Item' }];
        const newItem = createNewItem('/', items);
        expect(newItem.name).toBe('Item_2');
    });

    test('should handle existing items with numeric suffixes', () => {
        const items = [{ name: 'Item' }, { name: 'Item_2' }];
        const newItem = createNewItem('/', items);
        expect(newItem.name).toBe('Item_3');
    });

    test('should handle gaps in numeric suffixes', () => {
        const items = [{ name: 'Item' }, { name: 'Item_3' }];
        const newItem = createNewItem('/', items);
        expect(newItem.name).toBe('Item_4');
    });
});
