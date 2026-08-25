import { cp, mkdir, rm } from 'node:fs/promises';
const files = ['index.html','styles.css','manifest.webmanifest','sw.js','src','icons'];
await rm('dist', { recursive:true, force:true }); await mkdir('dist');
for (const file of files) await cp(file, `dist/${file}`, { recursive:true });
console.log('Build creado en dist/');
