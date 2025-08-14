import 'core-js/actual/structured-clone';
import { stringify, executePlan } from '../src/custom-parser.js';
import { initDB, addItem, deleteItem, getItems } from '../src/db.js';
import 'fake-indexeddb/auto';

describe('SomaType stringification with real DB', () => {
    beforeAll(async () => {
        await initDB();
    });

    test('should stringify a Soma item by fetching its children from the DB', async () => {
        const somaItem = await addItem({ name: 'my_sum_1', type: 'soma', path: '/' });
        const somaPath = `/${somaItem.name}/`;
        const child1 = await addItem({ name: 'a', type: 'number', value: 10, path: somaPath });
        const child2 = await addItem({ name: 'b', type: 'number', value: 5, path: somaPath });
        const child3 = await addItem({ name: 'c', type: 'text', value: 'ignore', path: somaPath });

        const itemsToStingify = await getItems('/');
        const plan = await stringify(itemsToStingify.filter(i => i.id === somaItem.id), '/');
        const result = await executePlan(plan, getItems);

        expect(result).toBe('{\n  my_sum_1: 10 + 5\n}');

        // Cleanup
        await deleteItem(somaItem.id);
        await deleteItem(child1.id);
        await deleteItem(child2.id);
        await deleteItem(child3.id);
    });

    test('should stringify an empty Soma item', async () => {
        const somaItem = await addItem({ name: 'my_sum_2', type: 'soma', path: '/' });
        const itemsToStingify = await getItems('/');

        const plan = await stringify(itemsToStingify.filter(i => i.id === somaItem.id), '/');
        const result = await executePlan(plan, getItems);

        expect(result).toBe('{\n  my_sum_2: 0\n}');

        // Cleanup
        await deleteItem(somaItem.id);
    });

    test('should stringify a Soma item with a single number child', async () => {
        const somaItem = await addItem({ name: 'my_sum_3', type: 'soma', path: '/' });
        const somaPath = `/${somaItem.name}/`;
        const child1 = await addItem({ name: 'a', type: 'number', value: 10, path: somaPath });

        const itemsToStingify = await getItems('/');
        const plan = await stringify(itemsToStingify.filter(i => i.id === somaItem.id), '/');
        const result = await executePlan(plan, getItems);

        expect(result).toBe('{\n  my_sum_3: 10\n}');

        // Cleanup
        await deleteItem(somaItem.id);
        await deleteItem(child1.id);
    });
});
