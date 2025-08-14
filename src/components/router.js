import { displayListView } from './list-view.js';
import { displayItemTabView } from './item-form.js';

export async function router() {
    const path = window.location.hash.substring(1) || '/';

    if (path.endsWith('/')) {
        await displayListView(path);
    } else {
        await displayItemTabView(path);
    }
}