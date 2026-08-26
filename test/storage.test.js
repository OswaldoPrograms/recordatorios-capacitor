import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppStorage, createWebStorage, replacementSet } from '../src/storage.js';

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

test('prepara un lote atómico para reemplazar registros SQLite',()=>{
  const set=replacementSet('tasks',[{id:'t1',title:'Contabilidad'},{id:'t2',title:'Reporte'}]);
  assert.equal(set[0].statement,'DELETE FROM tasks');
  assert.equal(set.length,3);
  assert.deepEqual(set[1].values,['t1',JSON.stringify({id:'t1',title:'Contabilidad'}),0]);
  assert.deepEqual(set[2].values,['t2',JSON.stringify({id:'t2',title:'Reporte'}),1]);
});

test('migra y guarda en SQLite mediante lotes transaccionales',async()=>{
  const local=memoryStorage({tasks:JSON.stringify([{id:'t1',title:'Inicial'}])});
  const batches=[];
  const plugin={
    async createConnection(){},async open(){},async execute(){},
    async executeSet(options){batches.push(options)},async run(){},
    async query(options){if(options.statement.includes('app_meta'))return{values:[]};return{values:[]}}
  };
  const storage=await createAppStorage(keys,{localStorage:local,Capacitor:{isNativePlatform:()=>true,Plugins:{CapacitorSQLite:plugin}}});
  assert.equal(storage.kind,'sqlite');
  assert.equal(batches.length,1);
  assert.equal(batches[0].transaction,true);
  assert.ok(batches[0].set.some(x=>x.statement.startsWith('INSERT INTO tasks')));
  await storage.saveCollections({tasks:[{id:'t2',title:'Persistente'}],people:[],notes:[]});
  assert.equal(batches.at(-1).transaction,true);
  assert.equal(JSON.parse(local.getItem('tasks'))[0].id,'t2');
});
