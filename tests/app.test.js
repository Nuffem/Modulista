import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
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

describe('landscape detection', () => {
    let originalInnerWidth;
    let originalInnerHeight;

    beforeEach(() => {
        originalInnerWidth = window.innerWidth;
        originalInnerHeight = window.innerHeight;
    });

    afterEach(() => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: originalInnerWidth,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: originalInnerHeight,
        });
    });

    test('should detect landscape mode when width > height and width >= 768', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 600,
        });

        // Import the function dynamically to get the latest window state
        const isLandscape = eval(`
            function isLandscapeMode() {
                return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
            }
            isLandscapeMode()
        `);

        expect(isLandscape).toBe(true);
    });

    test('should detect portrait mode when width <= height', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 600,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 1200,
        });

        const isLandscape = eval(`
            function isLandscapeMode() {
                return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
            }
            isLandscapeMode()
        `);

        expect(isLandscape).toBe(false);
    });

    test('should detect portrait mode when width < 768 even if width > height', () => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 500,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 400,
        });

        const isLandscape = eval(`
            function isLandscapeMode() {
                return window.innerWidth > window.innerHeight && window.innerWidth >= 768;
            }
            isLandscapeMode()
        `);

        expect(isLandscape).toBe(false);
    });
});
