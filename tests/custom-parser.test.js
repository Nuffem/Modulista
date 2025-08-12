import { parse, stringify } from '../src/custom-parser.js';

describe('parse', () => {
    test('should parse an empty list', () => {
        expect(parse('{}')).toEqual({});
    });

    test('should parse a list with a single text item', () => {
        expect(parse('{ name: "John" }')).toEqual({ name: 'John' });
    });

    test('should parse a list with a single boolean item (true)', () => {
        expect(parse('{ is_active: @1 }')).toEqual({ is_active: true });
    });

    test('should parse a list with a single boolean item (false)', () => {
        expect(parse('{ is_active: @0 }')).toEqual({ is_active: false });
    });

    test('should parse a list with a single number item', () => {
        expect(parse('{ age: 30 }')).toEqual({ age: 30 });
    });

    test('should parse a list with a sum expression', () => {
        expect(parse('{ total: 10 + 5 + 3 }')).toEqual({ total: [10, 5, 3] });
    });

    test('should parse a sum expression with spaces', () => {
        expect(parse('{ sum: 1.5 + 2.3 + 4.2 }')).toEqual({ sum: [1.5, 2.3, 4.2] });
    });

    test('should parse a sum expression with negative numbers', () => {
        expect(parse('{ result: -10 + 5 + -3 }')).toEqual({ result: [-10, 5, -3] });
    });

    test('should parse a list with a nested list', () => {
        const input = `{
            user: {
                name: "John"
                age: 30
            }
        }`;
        const expected = {
            user: {
                name: 'John',
                age: 30,
            },
        };
        expect(parse(input)).toEqual(expected);
    });

    test('should throw an error for a malformed list', () => {
        expect(() => parse('{')).toThrow();
    });

    test('should throw an error for a malformed item', () => {
        expect(() => parse('{ name: }')).toThrow();
    });

    test('should throw an error for a malformed boolean', () => {
        expect(() => parse('{ is_active: @2 }')).toThrow();
    });
});

describe('stringify', () => {
    test('should stringify an empty list', () => {
        const items = [];
        const expected = '{}';
        const result = stringify(items, 'some/path/');
        expect(result).toBe(expected);
    });

    test('should stringify a list with a single text item', () => {
        const items = [{ name: 'name', type: 'text', value: 'John' }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  name: ', '"John"'],
        });
    });

    test('should stringify a list with a single number item', () => {
        const items = [{ name: 'age', type: 'number', value: 30 }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  age: ', 30],
        });
    });

    test('should stringify a list with a sum item', () => {
        const items = [{ name: 'total', type: 'sum', value: [10, 5, 3] }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  total: ', { type: 'LIST', path: 'some/path/total/operandos/', indentLevel: 2 }],
        });
    });

    test('should stringify a sum with decimal numbers', () => {
        const items = [{ name: 'sum', type: 'sum', value: [1.5, 2.3, 4.2] }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  sum: ', { type: 'LIST', path: 'some/path/sum/operandos/', indentLevel: 2 }],
        });
    });

    test('should stringify an empty sum as list reference', () => {
        const items = [{ name: 'empty', type: 'sum', value: [] }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  empty: ', { type: 'LIST', path: 'some/path/empty/operandos/', indentLevel: 2 }],
        });
    });

    test('should stringify a list with a single boolean item (true)', () => {
        const items = [{ name: 'is_active', type: 'boolean', value: true }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  is_active: ', '@1'],
        });
    });

    test('should stringify a list with a single boolean item (false)', () => {
        const items = [{ name: 'is_active', type: 'boolean', value: false }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  is_active: ', '@0'],
        });
    });

    test('should stringify a list with multiple items', () => {
        const items = [
            { name: 'name', type: 'text', value: 'John' },
            { name: 'age', type: 'number', value: 30 },
            { name: 'is_active', type: 'boolean', value: true },
        ];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: [
                '  name: ', '"John"', '\n',
                '  age: ', 30, '\n',
                '  is_active: ', '@1'
            ],
        });
    });

    test('should stringify a list with a nested list', () => {
        const items = [
            { name: 'user', type: 'list', value: 'user/' },
        ];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: [
                '  user: ',
                { type: 'LIST', path: 'some/path/user/', indentLevel: 2 },
            ],
        });
    });

    test('should escape special characters in text values', () => {
        const items = [{ name: 'text', type: 'text', value: 'a"b\\c' }];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  text: ', '"a\\x22b\\x5cc"'],
        });
    });

    test('should stringify a simple number', () => {
        const items = [
            {
                name: 'result',
                type: 'number',
                value: 8,
            },
        ];
        const plan = stringify(items, 'some/path/');
        expect(plan).toEqual({
            prefix: '{\n',
            suffix: '\n}',
            parts: ['  result: ', 8],
        });
    });
});
