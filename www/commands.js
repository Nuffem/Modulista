export async function copyDirectory(sourceDir, targetDir){
	for await (const [name, handle] of sourceDir.entries()){
		if(handle.kind === 'file'){
			const f = await handle.getFile();
			const newF = await targetDir.getFileHandle(name, {create:true});
			const w = await newF.createWritable();
			await w.write(await f.arrayBuffer());
			await w.close();
		} else {
			const srcSub = await sourceDir.getDirectoryHandle(name);
			const tgtSub = await targetDir.getDirectoryHandle(name, {create:true});
			await copyDirectory(srcSub, tgtSub);
		}
	}
}

export async function getDirByPath(rootHandle, path){
	if(!path) return null;
	if(path === '/' || path === '') return rootHandle;
	const p = path.startsWith('/') ? path.slice(1) : path;
	const parts = p.split('/').filter(Boolean);
	let cur = rootHandle;
	for(const part of parts){
		try{
			cur = await cur.getDirectoryHandle(part);
		}catch(e){
			return null; // not found
		}
	}
	return cur;
}

export { renameSelected } from './commands/renomear.js';
export { moveSelected } from './commands/mover.js';
export { moveUpSelected } from './commands/mover_um_nível_acima.js';
