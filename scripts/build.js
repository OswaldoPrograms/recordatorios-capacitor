import { cp, mkdir, rm } from 'node:fs/promises';
const files = ['index.html','styles.css','manifest.webmanifest','sw.js','src','icons'];
await rm('dist', { recursive:true, force:true }); await mkdir('dist');
for (const file of files) await cp(file, `dist/${file}`, { recursive:true });
for (const [weight,font] of [['regular','Phosphor'],['fill','Phosphor-Fill']]) {
  const target=`dist/node_modules/@phosphor-icons/web/src/${weight}`; await mkdir(target,{recursive:true});
  await cp(`node_modules/@phosphor-icons/web/src/${weight}/style.css`,`${target}/style.css`);
  await cp(`node_modules/@phosphor-icons/web/src/${weight}/${font}.woff2`,`${target}/${font}.woff2`);
}
console.log('Build creado en dist/');
