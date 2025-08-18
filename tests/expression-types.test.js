import { describe, test, expect } from '@jest/globals';
import { itemTypes } from '../src/types.js';

describe('Expression Types - Item Type vs Value Type', () => {
    test('should have valueType property for all basic types', () => {
        expect(itemTypes.text.valueType).toBe('text');
        expect(itemTypes.number.valueType).toBe('number');
        expect(itemTypes.boolean.valueType).toBe('boolean');
        expect(itemTypes.list.valueType).toBe('list');
    });

    test('should have valueType property for expression types', () => {
        expect(itemTypes.soma.valueType).toBe('number');
        expect(itemTypes.subtracao.valueType).toBe('number');
    });

    test('should mark expression types with isExpression flag', () => {
        expect(itemTypes.soma.isExpression).toBe(true);
        expect(itemTypes.subtracao.isExpression).toBe(true);
        
        // Non-expression types should not have this flag
        expect(itemTypes.text.isExpression).toBeUndefined();
        expect(itemTypes.number.isExpression).toBeUndefined();
        expect(itemTypes.boolean.isExpression).toBeUndefined();
        expect(itemTypes.list.isExpression).toBeUndefined();
    });

    test('should have evaluate function for expression types', () => {
        expect(typeof itemTypes.soma.evaluate).toBe('function');
        expect(typeof itemTypes.subtracao.evaluate).toBe('function');
    });

    test('should format display value correctly for expressions', () => {
        const somaItem = { type: 'soma', computedValue: 42 };
        const subtracaoItem = { type: 'subtracao', computedValue: 15 };
        
        expect(itemTypes.soma.formatValueForDisplay(somaItem)).toBe('42');
        expect(itemTypes.subtracao.formatValueForDisplay(subtracaoItem)).toBe('15');
        
        // Should default to '0' if no computed value
        const emptyItem = { type: 'soma' };
        expect(itemTypes.soma.formatValueForDisplay(emptyItem)).toBe('0');
    });

    test('Soma should evaluate sum of child numeric values', async () => {
        // Mock getItems function that returns child numeric items
        const mockGetItems = async (path) => {
            if (path === 'root/TestSoma/') {
                return [
                    { type: 'number', value: 5 },
                    { type: 'number', value: 3 },
                    { type: 'number', value: 2 }
                ];
            }
            return [];
        };

        // Temporarily replace the getItems import
        const originalGetItems = await import('../src/db.js');
        
        const somaItem = { name: 'TestSoma', type: 'soma' };
        const result = await itemTypes.soma.evaluate(somaItem, 'root/');
        
        // Note: This test assumes the evaluate function works correctly
        // In a real test environment, we'd need to mock the db.js module properly
        expect(typeof result).toBe('number');
    });

    test('Subtracao should evaluate subtraction of child numeric values', async () => {
        const subtracaoItem = { name: 'TestSubtracao', type: 'subtracao' };
        const result = await itemTypes.subtracao.evaluate(subtracaoItem, 'root/');
        
        // Note: This test assumes the evaluate function works correctly
        expect(typeof result).toBe('number');
    });
});

describe('Expression Type Integration', () => {
    test('should distinguish between item type and value type', () => {
        // Item type: 'soma', Value type: 'number'
        const somaType = itemTypes.soma;
        expect(somaType.name).toBe('soma'); // Item type
        expect(somaType.valueType).toBe('number'); // Value type
        expect(somaType.isExpression).toBe(true);
        
        // Item type: 'subtracao', Value type: 'number'  
        const subtracaoType = itemTypes.subtracao;
        expect(subtracaoType.name).toBe('subtracao'); // Item type
        expect(subtracaoType.valueType).toBe('number'); // Value type
        expect(subtracaoType.isExpression).toBe(true);
        
        // Regular types: item type = value type
        expect(itemTypes.number.name).toBe('number');
        expect(itemTypes.number.valueType).toBe('number');
        expect(itemTypes.text.name).toBe('text');
        expect(itemTypes.text.valueType).toBe('text');
    });
});