import {emptyState} from './model.js';
const db=new Promise((resolve,reject)=>{const r=indexedDB.open('daily-ground',1);r.onupgradeneeded=()=>r.result.createObjectStore('accounts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export async function load(user){const d=await db;return new Promise((resolve,reject)=>{const r=d.transaction('accounts').objectStore('accounts').get(user);r.onsuccess=()=>resolve(r.result||emptyState());r.onerror=()=>reject(r.error);});}
export async function save(user,state){const d=await db;return new Promise((resolve,reject)=>{const t=d.transaction('accounts','readwrite');t.objectStore('accounts').put(state,user);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error('Local save aborted'));});}
