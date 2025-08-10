import { parse } from '../src/custom-parser.js';

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
