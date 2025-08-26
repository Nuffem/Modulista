import { describe, test, expect } from '@jest/globals';
import { parse, stringify } from '../src/custom-parser.js';

describe('Language 0 Comment Support', () => {
    test('should parse simple comment syntax', () => {
        const input = '{ note: // This is a comment }';
        const result = parse(input);
        
        expect(result).toEqual({
            note: {
                type: 'comment',
                value: 'This is a comment'
            }
        });
    });

    test('should parse comment with no text', () => {
        const input = '{ empty: // }';
        const result = parse(input);
        
        expect(result).toEqual({
            empty: {
                type: 'comment',
                value: ''
            }
        });
    });

    test('should parse multiple comments', () => {
        const input = '{ note1: // First comment note2: // Second comment }';
        const result = parse(input);
        
        expect(result).toEqual({
            note1: {
                type: 'comment',
                value: 'First comment'
            },
            note2: {
                type: 'comment',
                value: 'Second comment'
            }
        });
    });

    test('should handle comments with special characters', () => {
        const input = '{ special: // TODO: Fix this bug @urgent! }';
        const result = parse(input);
        
        expect(result).toEqual({
            special: {
                type: 'comment',
                value: 'TODO: Fix this bug @urgent!'
            }
        });
    });

    test('should trim whitespace from comments', () => {
        const input = '{ spaced: //   lots of spaces   }';
        const result = parse(input);
        
        expect(result).toEqual({
            spaced: {
                type: 'comment',
                value: 'lots of spaces'
            }
        });
    });

    test('should parse comments mixed with other types', () => {
        const input = '{ value: 42 note: // A number above func: x => x * 2 }';
        const result = parse(input);
        
        expect(result).toEqual({
            value: 42,
            note: {
                type: 'comment',
                value: 'A number above'
            },
            func: {
                type: 'function',
                value: {
                    param: 'x',
                    expression: 'x * 2'
                }
            }
        });
    });

    test('should stringify comment correctly', () => {
        const items = [{
            name: 'note',
            type: 'comment',
            value: 'This is a comment'
        }];
        
        const result = stringify(items, '/');
        expect(result.parts).toEqual([
            '  note: ',
            '// This is a comment'
        ]);
    });

    test('should stringify empty comment correctly', () => {
        const items = [{
            name: 'empty',
            type: 'comment',
            value: ''
        }];
        
        const result = stringify(items, '/');
        expect(result.parts).toEqual([
            '  empty: ',
            '// '
        ]);
    });
});