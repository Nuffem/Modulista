import{g as E,T as w,u as z,d as I,a as j,b as D,c as F,e as O,i as Y,l as x,f as q,s as A,h as N,p as R,j as K,k as H,m as X}from"./index-B0qOxVXC.js";const L=document.getElementById("app-container"),C=document.getElementById("breadcrumb");let k="list";function G(){return window.innerWidth>window.innerHeight&&window.innerWidth>=768}async function P(e,n=null){const t=e.split("/").filter(o=>o);let c="#/",p='<div class="flex items-center">';p+=`<button onclick="location.hash='/'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${await x("home",{size:"w-5 h-5"})}</button>`,t.forEach((o,u)=>{c+=`${o}/`,p+=` <span class="text-gray-500 mx-2">/</span> <button onclick="location.hash='${c}'" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">${decodeURIComponent(o)}</button>`}),n&&(p+=` <span class="text-gray-500 mx-2">/</span> <span class="font-semibold">${n}</span>`),p+="</div>",C.innerHTML=p}async function M(e,n){const t=await E(e),c=new Map(t.map(u=>[u.name,u])),p=new Set(Object.keys(n)),o=[];for(const u of p){const a=n[u],d=c.get(u),s=typeof a;let r;if(s==="string")r=D;else if(s==="number")r=F;else if(s==="boolean")r=O;else if(s==="object"&&a!==null)r=w;else{console.warn(`Unsupported value type for ${u}: ${s}`);continue}if(d)if(d.type===w&&r===w)o.push(M(`${e}${u}/`,a));else if(d.type!==w&&r!==w&&d.value!==a){const i={...d,value:a,type:r};o.push(z(i))}else d.type!==r&&o.push(I(d.id).then(()=>j({path:e,name:u,type:r,value:r===w?"":a})));else{const i={path:e,name:u,type:r,value:r===w?"":a};o.push(j(i).then(l=>{if(r===w)return M(`${e}${u}/`,a)}))}}for(const[u,a]of c.entries())p.has(u)||(a.type===w?o.push(U(`${e}${u}/`).then(()=>I(a.id))):o.push(I(a.id)));await Promise.all(o)}async function U(e){const n=await E(e),t=[];for(const c of n)c.type==="list"&&t.push(U(`${e}${c.name}/`)),t.push(I(c.id));await Promise.all(t)}function J(e){const n=X.map(t=>`
        <div class="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" data-type="${t.name}">
            ${t.label}
        </div>
    `).join("");return`
        <div class="relative" id="type-selector-container">
            <button type="button" id="type-selector-btn" class="w-full text-left shadow appearance-none border rounded py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                ${H[e.type].label}
            </button>
            <div id="type-selector-popup" class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden">
                <input type="text" id="type-filter" class="w-full p-2 border-b border-gray-300 dark:border-gray-600" placeholder="Filtrar tipos...">
                <div id="type-list">
                    ${n}
                </div>
            </div>
        </div>
    `}async function Q(e,n,t="list-content"){let c;const p=document.getElementById(t),o=async()=>{const a=await Promise.all(n.map(r=>_(r))),d=n.length===0?'<p class="text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>':'<ul id="item-list" class="space-y-3">'+a.join("")+"</ul>",s=`
            <button data-testid="add-item-button" onclick="handleAddItemClick('${e}')" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
                ${await x("plus",{size:"w-8 h-8"})}
            </button>
        `;p.innerHTML=d+s,c=document.getElementById("item-list"),u(c)},u=a=>{if(!a)return;let d=null;a.addEventListener("dragstart",s=>{const r=s.target.closest("li[data-id]");r&&r.draggable&&(d=r.dataset.id,s.dataTransfer.effectAllowed="move",s.dataTransfer.setData("text/plain",d),setTimeout(()=>{r.classList.add("opacity-50")},0))}),a.addEventListener("dragend",s=>{const r=s.target.closest("li[data-id]");r&&r.classList.remove("opacity-50")}),a.addEventListener("dragover",s=>{s.preventDefault(),s.dataTransfer.dropEffect="move";const r=s.target.closest("li[data-id]");if(r&&r.dataset.id!==d){const i=r.getBoundingClientRect(),l=(s.clientY-i.top)/(i.bottom-i.top)>.5,g=document.querySelector(`[data-id='${d}']`);g&&(l?r.parentNode.insertBefore(g,r.nextSibling):r.parentNode.insertBefore(g,r))}}),a.addEventListener("drop",async s=>{s.preventDefault();const i=Array.from(a.querySelectorAll("li[data-id]")).map(g=>g.dataset.id),l=n.map(g=>{const b=i.indexOf(g.id);return{...g,order:b}});try{await q(l),n=await E(e),await o()}catch(g){console.error("Failed to update item order:",g),await $(e)}})};await o()}async function Z(e,n,t="text-content"){const c=document.getElementById(t),p=`
        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
            <div id="text-display-${t}">
                <pre class="bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200"><code>Carregando...</code></pre>
                <div class="mt-4 flex justify-end space-x-2">
                    <button id="load-from-device-btn-${t}" title="Carregar do dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await x("upload",{size:"w-6 h-6"})}
                    </button>
                    <button id="save-to-device-btn-${t}" title="Salvar no dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await x("download",{size:"w-6 h-6"})}
                    </button>
                    <button id="edit-text-btn-${t}" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                        ${await x("pencil",{size:"w-6 h-6"})}
                    </button>
                </div>
            </div>
            <div id="text-edit-${t}" class="hidden">
                <textarea id="text-editor-${t}" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"></textarea>
                <div class="mt-4 flex justify-end space-x-2">
                    <button id="save-text-btn-${t}" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700">
                        ${await x("check",{size:"w-6 h-6"})}
                    </button>
                    <button id="cancel-text-btn-${t}" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                        ${await x("x",{size:"w-6 h-6"})}
                    </button>
                </div>
            </div>
        </div>
    `;c.innerHTML=p;const o=document.getElementById(`text-display-${t}`),u=document.getElementById(`text-edit-${t}`),a=document.getElementById(`text-editor-${t}`),d=o.querySelector("code");let s="";const r=A(n,e);N(r,E).then(i=>{s=i,d.textContent=s}).catch(i=>{d.textContent=`Erro ao gerar o texto: ${i.message}`,console.error("Stringify error:",i)}),document.getElementById(`load-from-device-btn-${t}`).addEventListener("click",()=>{const i=document.createElement("input");i.type="file",i.accept=".txt,text/plain",i.onchange=l=>{const g=l.target.files[0];if(!g)return;const b=new FileReader;b.onload=y=>{const m=y.target.result;a.value=m,s=m,o.classList.add("hidden"),u.classList.remove("hidden")},b.onerror=y=>{console.error("File could not be read!",y),alert("Erro ao ler o arquivo.")},b.readAsText(g)},i.click()}),document.getElementById(`save-to-device-btn-${t}`).addEventListener("click",()=>{const i=d.textContent,l=new Blob([i],{type:"text/plain;charset=utf-8"}),g=URL.createObjectURL(l),b=document.createElement("a");b.href=g;const y=e.split("/").filter(f=>f),m=y.length>0?`${y.join("_")}.txt`:"modulista_root.txt";b.download=m,document.body.appendChild(b),b.click(),setTimeout(()=>{document.body.removeChild(b),URL.revokeObjectURL(g)},100)}),document.getElementById(`edit-text-btn-${t}`).addEventListener("click",()=>{a.value=s,o.classList.add("hidden"),u.classList.remove("hidden")}),document.getElementById(`cancel-text-btn-${t}`).addEventListener("click",()=>{u.classList.add("hidden"),o.classList.remove("hidden")}),document.getElementById(`save-text-btn-${t}`).addEventListener("click",async()=>{const i=a.value;try{const l=R(i);await M(e,l),k="list",await $(e)}catch(l){console.error("Failed to parse and update items:",l),alert(`Erro ao salvar. Verifique a sintaxe.
`+l.message)}})}async function $(e){e.startsWith("/")||(e="/"+e),e.endsWith("/")||(e=e+"/"),L.innerHTML='<p class="text-gray-500 dark:text-gray-400">Carregando...</p>',C.style.display="block",await P(e);try{let n=await E(e);const t=G(),c=k==="list",p=k==="text";if(t){const o=`
                <div class="mb-4">
                    <div class="flex items-center justify-center mb-4">
                        <div class="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-700">
                            <span class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                ${await x("list",{size:"w-5 h-5 mr-2"})}
                                Lista
                            </span>
                            <span class="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                ${await x("code",{size:"w-5 h-5 mr-2"})}
                                Texto
                            </span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-6">
                        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                                ${await x("list",{size:"w-5 h-5 mr-2"})}
                                Lista
                            </h3>
                            <div id="list-content"></div>
                        </div>
                        <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                            <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center">
                                ${await x("code",{size:"w-5 h-5 mr-2"})}
                                Texto
                            </h3>
                            <div id="text-content"></div>
                        </div>
                    </div>
                </div>
            `;L.innerHTML=o,await Q(e,n,"list-content"),await Z(e,n,"text-content")}else{const o=`
                <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
                    <ul class="flex -mb-px text-sm font-medium text-center">
                        <li class="flex-1">
                            <button id="list-tab-btn" class="inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${c?"text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500":"border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700"}">
                                ${await x("list",{size:"w-5 h-5 mr-2"})}
                                Lista
                            </button>
                        </li>
                        <li class="flex-1">
                            <button id="text-tab-btn" class="inline-flex justify-center w-full items-center p-4 border-b-2 rounded-t-lg group ${p?"text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500":"border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-700"}">
                                ${await x("code",{size:"w-5 h-5 mr-2"})}
                                Texto
                            </button>
                        </li>
                    </ul>
                </div>
                <div id="tab-content"></div>
            `;L.innerHTML=o;const u=document.getElementById("tab-content");if(c){let s;const r=async()=>{const l=await Promise.all(n.map(y=>_(y))),g=n.length===0?'<p class="text-gray-500 dark:text-gray-400">Nenhum item encontrado.</p>':'<ul id="item-list" class="space-y-3">'+l.join("")+"</ul>",b=`
                    <button data-testid="add-item-button" onclick="handleAddItemClick('${e}')" class="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white font-bold w-16 h-16 rounded-full shadow-lg flex items-center justify-center dark:bg-blue-700 dark:hover:bg-blue-800">
                        ${await x("plus",{size:"w-8 h-8"})}
                    </button>
                `;u.innerHTML=g+b,s=document.getElementById("item-list"),i(s)},i=l=>{if(!l)return;let g=null;l.addEventListener("dragstart",b=>{const y=b.target.closest("li[data-id]");y&&y.draggable&&(g=y.dataset.id,b.dataTransfer.effectAllowed="move",b.dataTransfer.setData("text/plain",g),setTimeout(()=>{y.classList.add("opacity-50")},0))}),l.addEventListener("dragend",b=>{const y=b.target.closest("li[data-id]");y&&y.classList.remove("opacity-50")}),l.addEventListener("dragover",b=>{b.preventDefault(),b.dataTransfer.dropEffect="move";const y=b.target.closest("li[data-id]");if(y&&y.dataset.id!==g){const m=y.getBoundingClientRect(),f=(b.clientY-m.top)/(m.bottom-m.top)>.5,v=document.querySelector(`[data-id='${g}']`);v&&(f?y.parentNode.insertBefore(v,y.nextSibling):y.parentNode.insertBefore(v,y))}}),l.addEventListener("drop",async b=>{b.preventDefault();const m=Array.from(l.querySelectorAll("li[data-id]")).map(v=>v.dataset.id),f=n.map(v=>{const h=m.indexOf(v.id);return{...v,order:h}});try{await q(f),n=await E(e),await r()}catch(v){console.error("Failed to update item order:",v),await $(e)}})};await r()}else{const s=`
                <div class="bg-white p-4 rounded-lg shadow dark:bg-gray-800">
                    <div id="text-display">
                        <pre class="bg-gray-100 p-4 rounded overflow-x-auto dark:bg-gray-700 dark:text-gray-200"><code>Carregando...</code></pre>
                        <div class="mt-4 flex justify-end space-x-2">
                            <button id="load-from-device-btn" title="Carregar do dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                ${await x("upload",{size:"w-6 h-6"})}
                            </button>
                            <button id="save-to-device-btn" title="Salvar no dispositivo" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                ${await x("download",{size:"w-6 h-6"})}
                            </button>
                            <button id="edit-text-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-600 dark:hover:bg-blue-700">
                                ${await x("pencil",{size:"w-6 h-6"})}
                            </button>
                        </div>
                    </div>
                    <div id="text-edit" class="hidden">
                        <textarea id="text-editor" class="w-full h-64 bg-gray-100 p-4 rounded border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"></textarea>
                        <div class="mt-4 flex justify-end space-x-2">
                            <button id="save-text-btn" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded dark:bg-green-600 dark:hover:bg-green-700">
                                ${await x("check",{size:"w-6 h-6"})}
                            </button>
                            <button id="cancel-text-btn" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded dark:bg-gray-600 dark:hover:bg-gray-700">
                                ${await x("x",{size:"w-6 h-6"})}
                            </button>
                        </div>
                    </div>
                </div>
            `;u.innerHTML=s;const r=document.getElementById("text-display"),i=document.getElementById("text-edit"),l=document.getElementById("text-editor"),g=r.querySelector("code");let b="";const y=A(n,e);N(y,E).then(m=>{b=m,g.textContent=b}).catch(m=>{g.textContent=`Erro ao gerar o texto: ${m.message}`,console.error("Stringify error:",m)}),document.getElementById("load-from-device-btn").addEventListener("click",()=>{const m=document.createElement("input");m.type="file",m.accept=".txt,text/plain",m.onchange=f=>{const v=f.target.files[0];if(!v)return;const h=new FileReader;h.onload=T=>{const B=T.target.result;l.value=B,b=B,r.classList.add("hidden"),i.classList.remove("hidden")},h.onerror=T=>{console.error("File could not be read!",T),alert("Erro ao ler o arquivo.")},h.readAsText(v)},m.click()}),document.getElementById("save-to-device-btn").addEventListener("click",()=>{const m=g.textContent,f=new Blob([m],{type:"text/plain;charset=utf-8"}),v=URL.createObjectURL(f),h=document.createElement("a");h.href=v;const T=e.split("/").filter(W=>W),B=T.length>0?`${T.join("_")}.txt`:"modulista_root.txt";h.download=B,document.body.appendChild(h),h.click(),setTimeout(()=>{document.body.removeChild(h),URL.revokeObjectURL(v)},100)}),document.getElementById("edit-text-btn").addEventListener("click",()=>{l.value=b,r.classList.add("hidden"),i.classList.remove("hidden")}),document.getElementById("cancel-text-btn").addEventListener("click",()=>{i.classList.add("hidden"),r.classList.remove("hidden")}),document.getElementById("save-text-btn").addEventListener("click",async()=>{const m=l.value;try{const f=R(m);await M(e,f),k="list",await $(e)}catch(f){console.error("Failed to parse and update items:",f),alert(`Erro ao salvar. Verifique a sintaxe.
`+f.message)}})}const a=document.getElementById("list-tab-btn"),d=document.getElementById("text-tab-btn");a&&d&&(a.addEventListener("click",()=>{k!=="list"&&(k="list",$(e))}),d.addEventListener("click",()=>{k!=="text"&&(k="text",$(e))}))}}catch(n){console.error("Failed to render list view:",n),L.innerHTML='<p class="text-red-500">Erro ao carregar os itens.</p>'}}async function _(e){const n=`#${e.path}${e.name}${e.type===w?"/":""}`,t=H[e.type],c=t.formatValueForDisplay(e);return`
        <li data-id="${e.id}" draggable="true" class="p-4 bg-white rounded-lg shadow hover:bg-gray-50 transition flex items-center justify-between dark:bg-gray-800 dark:hover:bg-gray-700">
            <a href="${n}" class="flex items-center grow">
                <div class="mr-4">${await t.getIcon()}</div>
                <span class="font-semibold">${e.name}</span>
            </a>
            <div class="flex items-center">
                ${e.type===O?`<input type="checkbox" ${e.value?"checked":""} disabled class="form-checkbox h-5 w-5 text-blue-600 mr-4">`:`<span class="text-gray-700 mr-4 dark:text-gray-300">${c}</span>`}
                ${await x("grab-handle",{size:"w-6 h-6",color:"text-gray-400 dark:text-gray-500 cursor-grab handle"})}
            </div>
        </li>`}async function ee(e){const t=H[e.type].renderEditControl(e);return`
        <li data-id="${e.id}" draggable="false" class="p-4 bg-blue-50 rounded-lg shadow-lg dark:bg-gray-800 border border-blue-500">
            <form id="edit-item-form-${e.id}">
                <div class="mb-4">
                    <label for="item-name" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Nome</label>
                    <input type="text" id="item-name" name="name" value="${e.name}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" required>
                </div>
                <div class="mb-4">
                    <label for="item-type" class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Tipo</label>
                    <div id="item-type-selector-${e.id}">${J(e)}</div>
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300">Valor</label>
                    <div id="item-value-input-${e.id}">${t}</div>
                </div>
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded dark:bg-blue-600 dark:hover:bg-blue-700" title="Salvar">
                            ${await x("check",{size:"w-6 h-6"})}
                        </button>
                        <button type="button" onclick="location.hash='${e.path}'" class="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded dark:bg-gray-600 dark:hover:bg-gray-700" title="Cancelar">
                            ${await x("x",{size:"w-6 h-6"})}
                        </button>
                    </div>
                    <button type="button" id="delete-item-btn-${e.id}" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded" title="Excluir Item">
                        ${await x("trash",{size:"w-6 h-6"})}
                    </button>
                </div>
            </form>
        </li>`}function te(e,n){const t=n.querySelector("#type-selector-btn"),c=n.querySelector("#type-selector-popup");t.addEventListener("click",()=>{c.classList.toggle("hidden")}),document.addEventListener("click",a=>{!t.contains(a.target)&&!c.contains(a.target)&&c.classList.add("hidden")});const p=n.querySelector("#type-filter"),o=n.querySelector("#type-list"),u=Array.from(o.children);if(p.addEventListener("input",()=>{const a=p.value.toLowerCase();u.forEach(d=>{d.textContent.toLowerCase().includes(a)?d.style.display="block":d.style.display="none"})}),e.type===F){const a=n.querySelector("#number-operator"),d=n.querySelector("#number-operands");let r=typeof e.value=="object"&&e.value!==null?e.value.operands:[e.value,0];const i=l=>{l==="constant"?d.innerHTML=`<input type="number" id="item-value" name="value" value="${r[0]}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">`:d.innerHTML=`
                    <input type="number" name="operand1" value="${r[0]}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 mb-2" placeholder="Operando 1">
                    <input type="number" name="operand2" value="${r[1]}" class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" placeholder="Operando 2">
                `};i(a.value),a.addEventListener("change",l=>{r=[0,0],i(l.target.value)})}o.addEventListener("click",a=>{if(a.target.dataset.type){const d=a.target.dataset.type;if(d!==e.type){const s={...e,type:d,value:""};z(s).then(()=>{V(`${e.path}${e.name}`)})}c.classList.add("hidden")}}),n.addEventListener("submit",async a=>{a.preventDefault();const d=a.target,r=H[e.type].parseValue(d,e),i={...e,name:d.name.value,value:r};try{await z(i),location.hash=e.path}catch(l){console.error("Failed to update item:",l),alert(`Erro ao atualizar o item: ${l.message}`)}}),n.querySelector(`#delete-item-btn-${e.id}`).addEventListener("click",async()=>{if(confirm("Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."))try{await I(e.id),location.hash=e.path}catch(a){console.error("Failed to delete item:",a),alert("Erro ao excluir o item.")}})}async function V(e){try{const t=e.split("/").filter(d=>d),c=t.pop();let p=`/${t.join("/")}/`;p==="//"&&(p="/");const o=await K(p,c);if(!o){L.innerHTML='<p class="text-red-500">Item não encontrado.</p>',C.innerHTML="";return}C.style.display="block",await P(o.path,o.name);const u=await ee(o);L.innerHTML=`<div class="p-4 bg-white rounded-lg shadow dark:bg-gray-800">${u}</div>`;const a=document.getElementById(`edit-item-form-${o.id}`);a&&te(o,a)}catch(n){console.error("Failed to render item detail view:",n),L.innerHTML='<p class="text-red-500">Erro ao carregar o item.</p>'}}async function S(){const e=window.location.hash.substring(1)||"/";e.endsWith("/")?await $(e):await V(e)}function ae(e,n){const t="Item",c=n.filter(u=>u.name===t||u.name.startsWith(t+"_"));let p=0;if(c.length>0){const u=c.map(a=>{if(a.name===t)return 1;const d=a.name.match(/_(\d+)$/);return d?parseInt(d[1],10):0});p=Math.max(...u)}const o=p===0?t:`${t}_${p+1}`;return{path:e,name:o,type:D,value:""}}async function re(e){try{const n=await E(e),t=ae(e,n),c=await j(t);location.hash=`#${c.path}${c.name}`}catch(n){console.error("Failed to add item:",n),alert(`Erro ao adicionar o item: ${n.message}`)}}window.handleAddItemClick=re;document.addEventListener("DOMContentLoaded",async()=>{try{await Y(),console.log("Database ready."),window.addEventListener("hashchange",S),window.addEventListener("resize",()=>{const e=window.location.hash.substring(1)||"/";e.endsWith("/")&&$(e)}),await S()}catch(e){console.error("Failed to initialize database:",e),L.innerHTML='<p class="text-red-500">Error: Could not initialize the database.</p>'}});export{ae as createNewItem,re as handleAddItemClick,$ as renderListView,M as syncItems};
