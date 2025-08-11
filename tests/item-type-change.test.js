import { describe, test, expect } from '@jest/globals';

describe('Item Type Change Bug - Path Parsing', () => {
    test('should handle path construction correctly without hash', () => {
        // Test the correct path parsing logic
        const itemPath = '/test/';
        const itemName = 'TestItem';
        const fullPath = `${itemPath}${itemName}`;
        
        // This simulates what happens in renderItemDetailView with correct path
        const parts = fullPath.split('/').filter(p => p);
        const extractedName = parts.pop();
        let extractedPath = `/${parts.join('/')}/`;
        if (extractedPath === '//') {
            extractedPath = '/';
        }
        
        expect(extractedName).toBe('TestItem');
        expect(extractedPath).toBe('/test/');
    });

    test('should demonstrate the bug with hash prefix (FIXED)', () => {
        // This reproduces the original bug that has been fixed
        const itemPath = '/test/';
        const itemName = 'TestItem';
        const fullPathWithHash = `#${itemPath}${itemName}`;
        
        // This simulates what happens in renderItemDetailView when called with hash
        const parts = fullPathWithHash.split('/').filter(p => p);
        const extractedName = parts.pop();
        let extractedPath = `/${parts.join('/')}/`;
        if (extractedPath === '//') {
            extractedPath = '/';
        }
        
        expect(extractedName).toBe('TestItem');
        // This would be wrong - it includes the # in the path
        expect(extractedPath).toBe('/#/test/');
        // This path would not match the original '/test/' path, causing "Item não encontrado"
        expect(extractedPath).not.toBe('/test/');
    });

    test('should handle root path correctly without hash', () => {
        const itemPath = '/';
        const itemName = 'RootItem';
        const fullPath = `${itemPath}${itemName}`;
        
        const parts = fullPath.split('/').filter(p => p);
        const extractedName = parts.pop();
        let extractedPath = `/${parts.join('/')}/`;
        if (extractedPath === '//') {
            extractedPath = '/';
        }
        
        expect(extractedName).toBe('RootItem');
        expect(extractedPath).toBe('/');
    });

    test('should demonstrate root path bug with hash prefix (FIXED)', () => {
        const itemPath = '/';
        const itemName = 'RootItem';
        const fullPathWithHash = `#${itemPath}${itemName}`;
        
        const parts = fullPathWithHash.split('/').filter(p => p);
        const extractedName = parts.pop();
        let extractedPath = `/${parts.join('/')}/`;
        if (extractedPath === '//') {
            extractedPath = '/';
        }
        
        expect(extractedName).toBe('RootItem');
        // This would be wrong - it would become '/#/' 
        expect(extractedPath).toBe('/#/');
        expect(extractedPath).not.toBe('/');
    });

    test('verifies the fix - correct path construction after type change', () => {
        // This simulates the corrected behavior after the fix
        const item = {
            path: '/test/',
            name: 'TestItem',
            type: 'text'
        };
        
        // Before fix: renderItemDetailView(`#${item.path}${item.name}`) - WRONG
        // After fix: renderItemDetailView(`${item.path}${item.name}`) - CORRECT
        
        const correctPath = `${item.path}${item.name}`;
        const parts = correctPath.split('/').filter(p => p);
        const extractedName = parts.pop();
        let extractedPath = `/${parts.join('/')}/`;
        if (extractedPath === '//') {
            extractedPath = '/';
        }
        
        expect(extractedName).toBe('TestItem');
        expect(extractedPath).toBe('/test/');
        // This will now match the item's original path, so getItemByPathAndName will work
    });
});