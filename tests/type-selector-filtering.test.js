import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

// Setup DOM environment
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = window.document;
global.window = window;

// Mock icon loading since we don't have network access in tests
global.fetch = jest.fn().mockImplementation((url) => {
    return Promise.resolve({
        ok: true,
        text: () => Promise.resolve('<svg>mock icon</svg>')
    });
});

import { createInlineTypeSelector, createTypeSelector } from '../src/components/item-form.js';
import { itemTypes } from '../src/types.js';

describe('Type Selector Filtering', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    test('createInlineTypeSelector shows all types when no parent type specified', async () => {
        const selector = await createInlineTypeSelector();
        const typeOptions = selector.querySelectorAll('#type-list [data-type]');
        
        // Should show all available types
        expect(typeOptions.length).toBeGreaterThan(4); // We have at least text, number, boolean, list, soma, subtracao
        
        // Check that both numeric and non-numeric types are present
        const typeNames = Array.from(typeOptions).map(option => option.dataset.type);
        expect(typeNames).toContain('text');    // non-numeric
        expect(typeNames).toContain('number');  // numeric
        expect(typeNames).toContain('boolean'); // non-numeric
        expect(typeNames).toContain('list');    // non-numeric
        expect(typeNames).toContain('soma');    // numeric
        expect(typeNames).toContain('subtracao'); // numeric
    });

    test('createInlineTypeSelector filters to numeric types when parent is soma', async () => {
        const selector = await createInlineTypeSelector('soma');
        const typeOptions = selector.querySelectorAll('#type-list [data-type]');
        
        const typeNames = Array.from(typeOptions).map(option => option.dataset.type);
        
        // Should only show types with valueType 'number'
        for (const typeName of typeNames) {
            const typeDefinition = itemTypes[typeName];
            expect(typeDefinition.valueType).toBe('number');
        }
        
        // Should include number, soma, and subtracao (all have valueType 'number')
        expect(typeNames).toContain('number');
        expect(typeNames).toContain('soma');
        expect(typeNames).toContain('subtracao');
        
        // Should NOT include text, boolean, or list types
        expect(typeNames).not.toContain('text');
        expect(typeNames).not.toContain('boolean');
        expect(typeNames).not.toContain('list');
    });

    test('createInlineTypeSelector filters to numeric types when parent is subtracao', async () => {
        const selector = await createInlineTypeSelector('subtracao');
        const typeOptions = selector.querySelectorAll('#type-list [data-type]');
        
        const typeNames = Array.from(typeOptions).map(option => option.dataset.type);
        
        // Should only show types with valueType 'number'
        for (const typeName of typeNames) {
            const typeDefinition = itemTypes[typeName];
            expect(typeDefinition.valueType).toBe('number');
        }
        
        // Should include number, soma, and subtracao (all have valueType 'number')
        expect(typeNames).toContain('number');
        expect(typeNames).toContain('soma');
        expect(typeNames).toContain('subtracao');
        
        // Should NOT include text, boolean, or list types
        expect(typeNames).not.toContain('text');
        expect(typeNames).not.toContain('boolean');
        expect(typeNames).not.toContain('list');
    });

    test('createInlineTypeSelector shows all types for other parent types', async () => {
        const selector = await createInlineTypeSelector('list');
        const typeOptions = selector.querySelectorAll('#type-list [data-type]');
        
        // Should show all available types for non-expression parent types
        expect(typeOptions.length).toBeGreaterThan(4);
        
        const typeNames = Array.from(typeOptions).map(option => option.dataset.type);
        expect(typeNames).toContain('text');
        expect(typeNames).toContain('number');
        expect(typeNames).toContain('boolean');
        expect(typeNames).toContain('list');
        expect(typeNames).toContain('soma');
        expect(typeNames).toContain('subtracao');
    });

    test('createTypeSelector filters correctly for soma parent', async () => {
        const mockItem = { type: 'number' };
        const selector = createTypeSelector(mockItem, 'soma');
        const typeOptions = selector.querySelectorAll('#type-list [data-type]');
        
        const typeNames = Array.from(typeOptions).map(option => option.dataset.type);
        
        // Should only show numeric types
        expect(typeNames).toContain('number');
        expect(typeNames).toContain('soma');
        expect(typeNames).toContain('subtracao');
        expect(typeNames).not.toContain('text');
        expect(typeNames).not.toContain('boolean');
        expect(typeNames).not.toContain('list');
    });

    test('createTypeSelector filters correctly for subtracao parent', async () => {
        const mockItem = { type: 'number' };
        const selector = createTypeSelector(mockItem, 'subtracao');
        const typeOptions = selector.querySelectorAll('#type-list [data-type]');
        
        const typeNames = Array.from(typeOptions).map(option => option.dataset.type);
        
        // Should only show numeric types
        expect(typeNames).toContain('number');
        expect(typeNames).toContain('soma');
        expect(typeNames).toContain('subtracao');
        expect(typeNames).not.toContain('text');
        expect(typeNames).not.toContain('boolean');
        expect(typeNames).not.toContain('list');
    });

    test('valueType property is correctly defined for all types', () => {
        // Verify our filtering logic is based on correct valueType definitions
        expect(itemTypes.text.valueType).toBe('text');
        expect(itemTypes.number.valueType).toBe('number');
        expect(itemTypes.boolean.valueType).toBe('boolean');
        expect(itemTypes.list.valueType).toBe('list');
        expect(itemTypes.soma.valueType).toBe('number');
        expect(itemTypes.subtracao.valueType).toBe('number');
    });
});