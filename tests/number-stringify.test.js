import { stringify, executePlan } from '../src/custom-parser.js';

describe('number stringify edge cases', () => {
    const mockGetItems = async (path) => [];

    test('should handle number items with undefined value', async () => {
        const items = [{ name: 'age', type: 'number', value: undefined }];
        const plan = await stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with null value', async () => {
        const items = [{ name: 'age', type: 'number', value: null }];
        const plan = await stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with empty string value', async () => {
        const items = [{ name: 'age', type: 'number', value: '' }];
        const plan = await stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with NaN value', async () => {
        const items = [{ name: 'age', type: 'number', value: NaN }];
        const plan = await stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should preserve valid number values including zero', async () => {
        const items = [
            { name: 'age', type: 'number', value: 0 },
            { name: 'count', type: 'number', value: 42 },
            { name: 'price', type: 'number', value: -5.99 }
        ];
        const plan = await stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n  count: 42\n  price: -5.99\n}');
    });
});