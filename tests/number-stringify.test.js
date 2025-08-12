import { stringify, executePlan } from '../src/custom-parser.js';

describe('number stringify edge cases', () => {
    const mockGetItems = async (path) => [];

    test('should handle number items with undefined value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: undefined }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with null value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: null }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with empty string value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: '' }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with NaN value', async () => {
        const items = [{ nome: 'age', tipo: 'Numero', valor: NaN }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should preserve valid number values including zero', async () => {
        const items = [
            { nome: 'age', tipo: 'Numero', valor: 0 },
            { nome: 'count', tipo: 'Numero', valor: 42 },
            { nome: 'price', tipo: 'Numero', valor: -5.99 }
        ];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n  count: 42\n  price: -5.99\n}');
    });
});