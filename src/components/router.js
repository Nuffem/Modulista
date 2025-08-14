import { displayListView } from './list-view.js';

export async function router() {
    const path = window.location.hash.substring(1) || '/';
    await displayListView(path);
}