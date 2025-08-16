import { stringify, executePlan } from '../src/custom-parser.js';
import { itemTypes } from '../src/types.js';

describe('number stringify edge cases', () => {
    const mockGetItems = async (path) => [];

    test('should handle number items with undefined value', async () => {
        const items = [{ name: 'age', type: itemTypes.NUMBER.type, value: undefined }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with null value', async () => {
        const items = [{ name: 'age', type: itemTypes.NUMBER.type, value: null }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with empty string value', async () => {
        const items = [{ name: 'age', type: itemTypes.NUMBER.type, value: '' }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should handle number items with NaN value', async () => {
        const items = [{ name: 'age', type: itemTypes.NUMBER.type, value: NaN }];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n}');
    });

    test('should preserve valid number values including zero', async () => {
        const items = [
            { name: 'age', type: itemTypes.NUMBER.type, value: 0 },
            { name: 'count', type: itemTypes.NUMBER.type, value: 42 },
            { name: 'price', type: itemTypes.NUMBER.type, value: -5.99 }
        ];
        const plan = stringify(items, '/');
        const result = await executePlan(plan, mockGetItems);
        expect(result).toBe('{\n  age: 0\n  count: 42\n  price: -5.99\n}');
    });
});