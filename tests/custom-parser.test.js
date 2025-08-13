import { describe, test, expect, jest } from '@jest/globals';
import { parse, stringify } from '../src/custom-parser.js';

describe('custom-parser', () => {
    describe('parse', () => {
        test('should parse an empty list', () => {
            expect(parse('{}')).toEqual([]);
        });

        test('should parse a list with a single text item', () => {
            expect(parse('{ name: "John" }')).toEqual([{ nome: 'name', tipo: 'Texto', valor: 'John' }]);
        });

        test('should parse a list with a single boolean item (true)', () => {
            expect(parse('{ is_active: @1 }')).toEqual([{ nome: 'is_active', tipo: 'Booleano', valor: true }]);
        });

        test('should parse a list with a single boolean item (false)', () => {
            expect(parse('{ is_active: @0 }')).toEqual([{ nome: 'is_active', tipo: 'Booleano', valor: false }]);
        });

        test('should parse a list with a single number item', () => {
            expect(parse('{ age: 30 }')).toEqual([{ nome: 'age', tipo: 'Numero', valor: 30 }]);
        });

        test('should parse a list with a nested list', () => {
            const input = `{
                user: {
                    name: "John"
                    age: 30
                }
            }`;
            const expected = [{
                nome: 'user',
                tipo: 'Lista',
                valor: [
                    { nome: 'name', tipo: 'Texto', valor: 'John' },
                    { nome: 'age', tipo: 'Numero', valor: 30 },
                ],
            }];
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
        const mockGetItems = jest.fn();

        test('should stringify an empty list', async () => {
            const items = [];
            const expected = '{}';
            const result = await stringify(items, 'some/path/', mockGetItems);
            expect(result).toBe(expected);
        });

        test('should stringify a list with multiple items', async () => {
            const items = [
                { nome: 'name', tipo: 'Texto', valor: 'John' },
                { nome: 'age', tipo: 'Numero', valor: 30 },
                { nome: 'is_active', tipo: 'Booleano', valor: true },
            ];
            const result = await stringify(items, 'some/path/', mockGetItems);
            const expected = `
    {
      name: "John"
      age: 30
      is_active: @1
    }`.trim();
            expect(result.replace(/\s+/g, ' ').trim()).toBe(expected.replace(/\s+/g, ' ').trim());
        });

        test('should stringify a list with a nested list', async () => {
            const items = [
                { nome: 'user', tipo: 'Lista', valor: [] },
            ];
            mockGetItems.mockResolvedValueOnce([
                { nome: 'name', tipo: 'Texto', valor: 'Doe' },
            ]);
            const result = await stringify(items, 'some/path/', mockGetItems);
            const expected = `
    {
      user: {
        name: "Doe"
      }
    }`.trim();
            expect(result.replace(/\s+/g, ' ').trim()).toBe(expected.replace(/\s+/g, ' ').trim());
            expect(mockGetItems).toHaveBeenCalledWith('some/path/user/');
        });
    });
});
