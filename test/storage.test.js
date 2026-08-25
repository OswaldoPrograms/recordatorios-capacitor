import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebStorage } from '../src/storage.js';

const keys={tasks:'tasks',people:'people',notes:'notes',chat:'chat',ai:'ai',preferences:'preferences'};
function memoryStorage(seed={}) {
  const values=new Map(Object.entries(seed));
  return {getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
}

test('el almacenamiento web conserva todos los datos compatibles',async()=>{
  const local=memoryStorage();
  const storage=createWebStorage(keys,local);
  await storage.saveCollections({tasks:[{id:'t1'}],people:[{id:'p1'}],notes:[{id:'n1'}]});
  await storage.saveChat([{role:'user',content:'hola'}]);
  await storage.saveSetting('preferences',{defaultPriority:'high'});
  await storage.saveSetting('ai',{model:'demo'});
  await storage.saveSetting('theme','dark');
  const data=await storage.loadAll();
  assert.equal(data.tasks[0].id,'t1');
  assert.equal(data.people[0].id,'p1');
  assert.equal(data.notes[0].id,'n1');
  assert.equal(data.chat[0].content,'hola');
  assert.equal(data.preferences.defaultPriority,'high');
  assert.equal(data.ai.model,'demo');
  assert.equal(data.theme,'dark');
});

test('borrar datos limpia también ajustes y tema',async()=>{
  const local=memoryStorage({tasks:'[]','recordatorios.theme':'dark'});
  const storage=createWebStorage(keys,local);
  await storage.clearAll();
  assert.deepEqual((await storage.loadAll()).tasks,[]);
  assert.equal((await storage.loadAll()).theme,'light');
});
