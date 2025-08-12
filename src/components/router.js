import { renderListView } from './list-view.js';
import { renderItemDetailView, renderItemTabView } from './item-form.js';

export async function router() {
    const path = window.location.hash.substring(1) || '/';

    if (path.endsWith('/operandos')) {
        // Handle Sum item operandos view - render list with only number types allowed
        const basePath = path.substring(0, path.length - '/operandos'.length);
        await renderListView(path, 'operandos');
    } else if (path.endsWith('/')) {
        await renderListView(path);
    } else {
        await renderItemTabView(path);
    }
}