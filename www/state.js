export let rootHandle = null;
export let selected = null;

export function setRootHandle(h){ rootHandle = h; }
export function getRootHandle(){ return rootHandle; }

export function setSelected(s){ selected = s; }
export function getSelected(){ return selected; }

export function clearState(){ rootHandle = null; selected = null; }

const DB_NAME = 'modulista-db';
const STORE_NAME = 'handles';
const ROOT_KEY = 'root';

function openDB(){
	return new Promise((resolve, reject)=>{
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = (e) => {
			const db = e.target.result;
			if(!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

async function putRootHandle(handle){
	const db = await openDB();
	return new Promise((resolve, reject)=>{
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const r = store.put(handle, ROOT_KEY);
		r.onsuccess = ()=>{ resolve(true); db.close(); };
		r.onerror = ()=>{ reject(r.error); db.close(); };
	});
}

async function getRootHandleFromDB(){
	const db = await openDB();
	return new Promise((resolve, reject)=>{
		const tx = db.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const r = store.get(ROOT_KEY);
		r.onsuccess = ()=>{ resolve(r.result); db.close(); };
		r.onerror = ()=>{ reject(r.error); db.close(); };
	});
}

async function deleteRootHandleFromDB(){
	const db = await openDB();
	return new Promise((resolve, reject)=>{
		const tx = db.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		const r = store.delete(ROOT_KEY);
		r.onsuccess = ()=>{ resolve(true); db.close(); };
		r.onerror = ()=>{ reject(r.error); db.close(); };
	});
}

export async function persistRootHandle(){
	if(!rootHandle){
		try{ await deleteRootHandleFromDB(); }catch(_){ }
		return;
	}
	try{
		await putRootHandle(rootHandle);
	}catch(e){
		console.warn('persistRootHandle error', e);
	}
}

export async function restoreRootHandle(){
	try{
		const h = await getRootHandleFromDB();
		return h || null;
	}catch(e){
		console.warn('restoreRootHandle error', e);
		return null;
	}
}

export async function deletePersistedRoot(){
	try{ await deleteRootHandleFromDB(); }catch(e){ console.warn('deletePersistedRoot', e); }
}

export async function ensureHandlePermission(handle, mode = 'readwrite'){
	if(!handle) return false;
	if(typeof handle.queryPermission !== 'function') return true;
	try{
		const q = await handle.queryPermission({ mode });
		if(q === 'granted') return true;
		const r = await handle.requestPermission({ mode });
		return r === 'granted';
	}catch(e){
		console.warn('ensureHandlePermission', e);
		return false;
	}
}
