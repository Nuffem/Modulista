import { describe, test, expect, afterEach, jest } from '@jest/globals';
import { stringify } from '../src/custom-parser.js';

const mockGetItems = jest.fn();

describe('number stringify edge cases', () => {
    afterEach(() => {
        mockGetItems.mockClear();
    });

    test('should handle number items with undefined value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: undefined }];
        const result = await stringify(items, '/', mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with null value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: null }];
        const result = await stringify(items, '/', mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with empty string value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: '' }];
        const result = await stringify(items, '/', mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with NaN value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: NaN }];
        const result = await stringify(items, '/', mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should preserve valid number values including zero', async () => {
        const items = [
            { nome: 'age', tipo: 'Numero', valor: 0 },
            { nome: 'count', tipo: 'Numero', valor: 42 },
            { nome: 'price', tipo: 'Numero', valor: -5.99 }
        ];
        const result = await stringify(items, '/', mockGetItems);
        expect(result.trim()).toBe('{\n  age: 0\n  count: 42\n  price: -5.99\n}');
    });

    test('should correctly stringify a nested list', async () => {
        const items = [
            { nome: 'user', tipo: 'Lista', valor: [] }
        ];

        mockGetItems.mockResolvedValueOnce([
            { nome: 'name', tipo: 'Texto', valor: 'John' },
            { nome: 'age', tipo: 'Numero', valor: 30 }
        ]);

        const result = await stringify(items, '/', mockGetItems);

        const expected = `
{
  user: {
    name: "John"
    age: 30
  }
}`.trim();

        const normalizedResult = result.replace(/\s+/g, ' ').trim();
        const normalizedExpected = expected.replace(/\s+/g, ' ').trim();

        expect(normalizedResult).toBe(normalizedExpected);
        expect(mockGetItems).toHaveBeenCalledWith('/user/');
    });
});