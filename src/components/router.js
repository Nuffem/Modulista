import { renderListView } from './list-view.js';
import { renderItemDetailView, renderItemTabView } from './item-form.js';

export async function router() {
    const path = window.location.hash.substring(1) || '/';
    console.log(`Routing to path: ${path}`);

    if (path.endsWith('/')) {
        await renderListView(path);
    } else {
        await renderItemTabView(path);
    }
}