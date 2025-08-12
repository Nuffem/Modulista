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
