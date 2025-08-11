import { renderListView } from './list-view.js';
import { renderItemDetailView } from './item-form.js';

export async function router() {
    const path = window.location.hash.substring(1) || '/';

    if (path.endsWith('/')) {
        await renderListView(path);
    } else {
        await renderItemDetailView(path);
    }
}