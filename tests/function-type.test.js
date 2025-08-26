import { describe, test, expect } from '@jest/globals';
import { parse, stringify } from '../src/custom-parser.js';

describe('Language 0 Function Support', () => {
    test('should parse simple function syntax', () => {
        const input = '{ square: x => x * x }';
        const result = parse(input);
        
        expect(result).toEqual({
            square: {
                type: 'function',
                value: {
                    param: 'x',
                    expression: 'x * x'
                }
            }
        });
    });

    test('should parse function with complex expression', () => {
        const input = '{ sum: args => args[0] + args[1] }';
        const result = parse(input);
        
        expect(result).toEqual({
            sum: {
                type: 'function',
                value: {
                    param: 'args',
                    expression: 'args[0] + args[1]'
                }
            }
        });
    });

    test('should parse multiple functions', () => {
        const input = '{ double: x => x * 2 triple: y => y * 3 }';
        const result = parse(input);
        
        expect(result).toEqual({
            double: {
                type: 'function',
                value: {
                    param: 'x',
                    expression: 'x * 2'
                }
            },
            triple: {
                type: 'function',
                value: {
                    param: 'y',
                    expression: 'y * 3'
                }
            }
        });
    });

    test('should handle functions with underscore parameters', () => {
        const input = '{ identity: _ => "constant" }';
        const result = parse(input);
        
        expect(result).toEqual({
            identity: {
                type: 'function',
                value: {
                    param: '_',
                    expression: '"constant"'
                }
            }
        });
    });

    test('should throw error for invalid function syntax', () => {
        expect(() => parse('{ invalid: x > x * 2 }')).toThrow();
        expect(() => parse('{ missing: => x * 2 }')).toThrow();
        expect(() => parse('{ empty: x => }')).toThrow();
    });

    test('should stringify function correctly', () => {
        const items = [{
            name: 'square',
            type: 'function',
            value: {
                param: 'x',
                expression: 'x * x'
            }
        }];
        
        const result = stringify(items, '/');
        expect(result.parts).toEqual([
            '  square: ',
            'x => x * x'
        ]);
    });
});