import { loadIcon } from '../src/icon-loader.js';

describe('Icon Color Mapping by ValueType', () => {
    test('should use blue color for text valueType', async () => {
        const iconHtml = await loadIcon('text', { valueType: 'text' });
        expect(iconHtml).toContain('text-blue-600');
        expect(iconHtml).toContain('dark:text-blue-400');
    });

    test('should use green color for number valueType', async () => {
        const iconHtml = await loadIcon('number', { valueType: 'number' });
        expect(iconHtml).toContain('text-green-600');
        expect(iconHtml).toContain('dark:text-green-400');
    });

    test('should use purple color for boolean valueType', async () => {
        const iconHtml = await loadIcon('boolean', { valueType: 'boolean' });
        expect(iconHtml).toContain('text-purple-600');
        expect(iconHtml).toContain('dark:text-purple-400');
    });

    test('should use orange color for list valueType', async () => {
        const iconHtml = await loadIcon('list-square', { valueType: 'list' });
        expect(iconHtml).toContain('text-orange-600');
        expect(iconHtml).toContain('dark:text-orange-400');
    });

    test('should use default gray color when no valueType is provided', async () => {
        const iconHtml = await loadIcon('home');
        expect(iconHtml).toContain('text-gray-500');
        expect(iconHtml).toContain('dark:text-gray-400');
    });

    test('should use custom color when both valueType and color are provided', async () => {
        const iconHtml = await loadIcon('text', { 
            valueType: 'text', 
            color: 'text-red-500 dark:text-red-300' 
        });
        // Custom color should take precedence over valueType color
        expect(iconHtml).toContain('text-red-500');
        expect(iconHtml).toContain('dark:text-red-300');
    });

    test('should fallback to default color for unknown valueType', async () => {
        const iconHtml = await loadIcon('home', { valueType: 'unknown' });
        expect(iconHtml).toContain('text-gray-500');
        expect(iconHtml).toContain('dark:text-gray-400');
    });
});