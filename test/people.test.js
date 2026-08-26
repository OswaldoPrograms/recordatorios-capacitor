import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichPerson, findPeople, publicPerson } from '../src/people.js';

const gael=enrichPerson({id:'1',name:'Gael García',relationship:'Hermano',phone:'+52 782 123 4567',aliases:'Gae',company:'Universidad',notes:'Le gusta la música'});

test('crea términos privados útiles para buscar personas',()=>{
  assert.ok(gael.searchTags.includes('hermano'));
  assert.ok(gael.searchTags.includes('familia'));
  assert.ok(gael.searchTags.includes('4567'));
  assert.ok(gael.searchTags.includes('gae'));
});

test('encuentra por relación, apodo, nota y últimos números',()=>{
  for(const query of ['mi hermano','Gae','música','número de mi hermano','4567'])assert.equal(findPeople([gael],query)[0].id,'1');
});

test('no entrega términos privados a la IA',()=>{
  const visible=publicPerson(gael);
  assert.equal('searchTags' in visible,false);
  assert.equal('color' in visible,false);
  assert.equal('email' in visible,false);
  assert.equal(visible.phone,'+52 782 123 4567');
});
