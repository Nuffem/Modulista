export let rootHandle = null;
export let selected = null;

export function setRootHandle(h){ rootHandle = h; }
export function getRootHandle(){ return rootHandle; }

export function setSelected(s){ selected = s; }
export function getSelected(){ return selected; }

export function clearState(){ rootHandle = null; selected = null; }
