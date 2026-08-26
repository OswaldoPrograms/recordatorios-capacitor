const fold = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function personSearchTags(person) {
  const values=[person.name,person.relationship,person.phone,person.email,person.aliases,person.birthday,person.address,person.company,person.notes];
  const words=values.flatMap(value=>fold(value).split(/[^a-z0-9@+.]+/)).filter(Boolean);
  const relationship=fold(person.relationship);
  const related={madre:['mama','familia'],padre:['papa','familia'],hermano:['familia'],hermana:['familia'],pareja:['novio','novia','esposo','esposa','familia'],amigo:['amistad'],amiga:['amistad'],contador:['contabilidad','trabajo'],contadora:['contabilidad','trabajo'],profesor:['escuela','universidad'],profesora:['escuela','universidad']}[relationship]||[];
  const phoneDigits=String(person.phone||'').replace(/\D/g,'');
  if(phoneDigits){words.push(phoneDigits);if(phoneDigits.length>=4)words.push(phoneDigits.slice(-4))}
  return [...new Set([...words,...related])];
}

export function enrichPerson(person) {
  const normalized={relationship:'',phone:'',email:'',aliases:'',birthday:'',address:'',company:'',notes:'',color:'#6750a4',...person};
  normalized.searchTags=personSearchTags(normalized);
  return normalized;
}

export function findPeople(people, query='') {
  const ignored=new Set(['a','al','de','del','el','ella','la','las','los','mi','mis','numero','número','persona','telefono','teléfono','un','una','y']);
  const terms=fold(query).split(/\s+/).filter(term=>term&&!ignored.has(term));
  if(!terms.length)return people;
  return people.filter(person=>{
    const searchable=personSearchTags(person).join(' ');
    return terms.every(term=>searchable.includes(term));
  });
}

export function publicPerson(person) {
  const {searchTags,color,id,name,...details}=enrichPerson(person);
  const useful=Object.fromEntries(Object.entries(details).filter(([,value])=>value!==''&&value!==null&&value!==undefined));
  return {id,name,...useful};
}
