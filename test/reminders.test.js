import test from 'node:test'; import assert from 'node:assert/strict';
import { filterReminders, getSummary, localDateKey, nextOccurrence, validateReminder } from '../src/reminders.js';
const base={id:'1',title:'Pagar internet',notes:'',date:'2026-08-25',time:'12:00',priority:'medium',repeat:'none',completed:false};
test('genera fecha local estable',()=>assert.equal(localDateKey(new Date(2026,7,5)),'2026-08-05'));
test('rechaza título vacío',()=>assert.equal(validateReminder({...base,title:''},new Date('2026-08-25T10:00:00')),'Escribe un título.'));
test('filtra pendientes y búsqueda',()=>{const items=[base,{...base,id:'2',title:'Comprar pan',completed:true}]; assert.deepEqual(filterReminders(items,'pending','internet').map(x=>x.id),['1']);});
test('resume estados',()=>assert.deepEqual(getSummary([base,{...base,id:'2',completed:true}], '2026-08-25'),{pending:1,today:1,done:1}));
test('crea siguiente repetición semanal',()=>{const next=nextOccurrence({...base,repeat:'weekly'}); assert.equal(next.date,'2026-09-01'); assert.equal(next.completed,false);});
