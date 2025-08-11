import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { resolveRoute } from '../src/router.js';

describe('resolveRoute', () => {
    let getItems;
    let getItemByPathAndName;

    beforeEach(() => {
        // Reset mocks before each test
        getItems = jest.fn();
        getItemByPathAndName = jest.fn();
    });

    test('should return a list view for a path ending with "/"', async () => {
        const mockPath = '/items/';
        const mockItems = [{ id: '1', name: 'item1' }, { id: '2', name: 'item2' }];
        getItems.mockResolvedValue(mockItems);

        const result = await resolveRoute(mockPath, getItems, getItemByPathAndName);

        expect(result).toEqual({ view: 'list', path: mockPath, items: mockItems });
        expect(getItems).toHaveBeenCalledWith(mockPath);
        expect(getItemByPathAndName).not.toHaveBeenCalled();
    });

    test('should return a detail view for a path not ending with "/"', async () => {
        const mockPath = '/items/item1';
        const mockItem = { id: '1', name: 'item1', path: '/items/' };
        getItemByPathAndName.mockResolvedValue(mockItem);

        const result = await resolveRoute(mockPath, getItems, getItemByPathAndName);

        expect(result).toEqual({ view: 'detail', item: mockItem });
        expect(getItemByPathAndName).toHaveBeenCalledWith('/items/', 'item1');
        expect(getItems).not.toHaveBeenCalled();
    });

    test('should correctly parse a root-level item path', async () => {
        const mockPath = '/item1';
        const mockItem = { id: '1', name: 'item1', path: '/' };
        getItemByPathAndName.mockResolvedValue(mockItem);

        const result = await resolveRoute(mockPath, getItems, getItemByPathAndName);

        expect(result).toEqual({ view: 'detail', item: mockItem });
        expect(getItemByPathAndName).toHaveBeenCalledWith('/', 'item1');
        expect(getItems).not.toHaveBeenCalled();
    });

    test('should return a notFound view if the item does not exist', async () => {
        const mockPath = '/items/nonexistent';
        getItemByPathAndName.mockResolvedValue(null);

        const result = await resolveRoute(mockPath, getItems, getItemByPathAndName);

        expect(result).toEqual({ view: 'notFound', path: mockPath });
        expect(getItemByPathAndName).toHaveBeenCalledWith('/items/', 'nonexistent');
    });

    test('should return an error view if getItems fails', async () => {
        const mockPath = '/items/';
        const errorMessage = 'Database connection failed';
        getItems.mockRejectedValue(new Error(errorMessage));

        const result = await resolveRoute(mockPath, getItems, getItemByPathAndName);

        expect(result).toEqual({ view: 'error', message: 'Failed to load items.' });
    });

    test('should return an error view if getItemByPathAndName fails', async () => {
        const mockPath = '/items/item1';
        const errorMessage = 'Database connection failed';
        getItemByPathAndName.mockRejectedValue(new Error(errorMessage));

        const result = await resolveRoute(mockPath, getItems, getItemByPathAndName);

        expect(result).toEqual({ view: 'error', message: 'Failed to load item.' });
    });

    test('should handle root path correctly', async () => {
        const mockPath = '/';
        const mockItems = [{ id: '1', name: 'root_item' }];
        getItems.mockResolvedValue(mockItems);

        const result = await resolveRoute(mockPath, getItems, getItemByPathAndName);

        expect(result).toEqual({ view: 'list', path: '/', items: mockItems });
        expect(getItems).toHaveBeenCalledWith('/');
    });
});
