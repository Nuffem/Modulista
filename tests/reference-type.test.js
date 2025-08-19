import { describe, test, expect } from '@jest/globals';
import { parse, stringify } from '../src/custom-parser.js';

describe('Reference Type Functionality', () => {
    test('should parse references correctly', () => {
        const input = '{ a: 2 b: a }';
        const result = parse(input);
        
        expect(result).toEqual({
            a: 2,
            b: { type: 'reference', name: 'a' }
        });
    });

    test('should parse multiple references', () => {
        const input = '{ x: 42 y: "hello" z: x w: y }';
        const result = parse(input);
        
        expect(result).toEqual({
            x: 42,
            y: "hello",
            z: { type: 'reference', name: 'x' },
            w: { type: 'reference', name: 'y' }
        });
    });

    test('should handle references with underscores and numbers', () => {
        const input = '{ property_1: 100 ref_2: property_1 }';
        const result = parse(input);
        
        expect(result).toEqual({
            property_1: 100,
            ref_2: { type: 'reference', name: 'property_1' }
        });
    });

    test('should handle mixed types with references', () => {
        const input = '{ num: 42 bool: @1 text: "hello" ref: num }';
        const result = parse(input);
        
        expect(result).toEqual({
            num: 42,
            bool: true,
            text: "hello",
            ref: { type: 'reference', name: 'num' }
        });
    });

    test('should stringify references correctly', () => {
        const items = [
            { name: 'a', type: 'number', value: 2 },
            { name: 'b', type: 'reference', value: 'a' }
        ];
        
        const result = stringify(items, '/');
        expect(result.parts).toEqual([
            '  a: ',
            '2',
            '\n',
            '  b: ',
            'a'
        ]);
    });

    test('should handle references in nested structures', () => {
        const input = '{ outer: { inner: 42 ref: inner } }';
        const result = parse(input);
        
        expect(result).toEqual({
            outer: {
                inner: 42,
                ref: { type: 'reference', name: 'inner' }
            }
        });
    });

    test('should parse valid identifier names for references', () => {
        const input = '{ _validName: 1 validName2: 2 CamelCase: 3 ref1: _validName ref2: validName2 ref3: CamelCase }';
        const result = parse(input);
        
        expect(result).toEqual({
            _validName: 1,
            validName2: 2,
            CamelCase: 3,
            ref1: { type: 'reference', name: '_validName' },
            ref2: { type: 'reference', name: 'validName2' },
            ref3: { type: 'reference', name: 'CamelCase' }
        });
    });

    test('should reject invalid reference names', () => {
        expect(() => parse('{ a: 1invalid }')).toThrow();
        expect(() => parse('{ a: 2name }')).toThrow();
    });
});