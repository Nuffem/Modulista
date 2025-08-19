import { stringify, executePlan } from '../src/custom-parser.js';

describe('Expression types text formatting with mathematical operators', () => {
    
    test('Soma should format as mathematical expression with + operator', async () => {
        const mockGetItems = async (path) => {
            if (path === 'root/MySum/') {
                return [
                    { name: 'val1', type: 'number', value: 10 },
                    { name: 'val2', type: 'number', value: 5 },
                    { name: 'val3', type: 'number', value: 3 }
                ];
            }
            return [];
        };

        const items = [{ name: 'MySum', type: 'soma' }];
        const plan = stringify(items, 'root/');
        const result = await executePlan(plan, mockGetItems);
        
        // Should format as 10 + 5 + 3 instead of nested structure
        expect(result).toBe('{\n  MySum: 10 + 5 + 3\n}');
    });

    test('Subtracao should format as mathematical expression with - operator', async () => {
        const mockGetItems = async (path) => {
            if (path === 'root/MySubtraction/') {
                return [
                    { name: 'val1', type: 'number', value: 20 },
                    { name: 'val2', type: 'number', value: 8 },
                    { name: 'val3', type: 'number', value: 2 }
                ];
            }
            return [];
        };

        const items = [{ name: 'MySubtraction', type: 'subtracao' }];
        const plan = stringify(items, 'root/');
        const result = await executePlan(plan, mockGetItems);
        
        // Should format as 20 - 8 - 2 instead of nested structure
        expect(result).toBe('{\n  MySubtraction: 20 - 8 - 2\n}');
    });

    test('Soma with single value should work correctly', async () => {
        const mockGetItems = async (path) => {
            if (path === 'root/SingleSum/') {
                return [{ name: 'val1', type: 'number', value: 42 }];
            }
            return [];
        };

        const items = [{ name: 'SingleSum', type: 'soma' }];
        const plan = stringify(items, 'root/');
        const result = await executePlan(plan, mockGetItems);
        
        expect(result).toBe('{\n  SingleSum: 42\n}');
    });

    test('Subtracao with single value should work correctly', async () => {
        const mockGetItems = async (path) => {
            if (path === 'root/SingleSub/') {
                return [{ name: 'val1', type: 'number', value: 42 }];
            }
            return [];
        };

        const items = [{ name: 'SingleSub', type: 'subtracao' }];
        const plan = stringify(items, 'root/');
        const result = await executePlan(plan, mockGetItems);
        
        expect(result).toBe('{\n  SingleSub: 42\n}');
    });

    test('Empty Soma should format as empty string', async () => {
        const mockGetItems = async (path) => {
            if (path === 'root/EmptySum/') {
                return [];
            }
            return [];
        };

        const items = [{ name: 'EmptySum', type: 'soma' }];
        const plan = stringify(items, 'root/');
        const result = await executePlan(plan, mockGetItems);
        
        expect(result).toBe('{\n  EmptySum: \n}');
    });

    test('Empty Subtracao should format as empty string', async () => {
        const mockGetItems = async (path) => {
            if (path === 'root/EmptySub/') {
                return [];
            }
            return [];
        };

        const items = [{ name: 'EmptySub', type: 'subtracao' }];
        const plan = stringify(items, 'root/');
        const result = await executePlan(plan, mockGetItems);
        
        expect(result).toBe('{\n  EmptySub: \n}');
    });

    test('Mixed types - should only include numbers in mathematical expression', async () => {
        const mockGetItems = async (path) => {
            if (path === 'root/MixedSum/') {
                return [
                    { name: 'num1', type: 'number', value: 10 },
                    { name: 'text1', type: 'text', value: 'ignored' },
                    { name: 'num2', type: 'number', value: 5 },
                    { name: 'bool1', type: 'boolean', value: true }
                ];
            }
            return [];
        };

        const items = [{ name: 'MixedSum', type: 'soma' }];
        const plan = stringify(items, 'root/');
        const result = await executePlan(plan, mockGetItems);
        
        // Should only include the numeric values
        expect(result).toBe('{\n  MixedSum: 10 + 5\n}');
    });
});