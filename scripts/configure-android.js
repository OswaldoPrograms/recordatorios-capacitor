import { readFile, writeFile } from 'node:fs/promises';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
const permission = '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />';

try {
  let manifest = await readFile(manifestPath, 'utf8');
  if (!manifest.includes('android.permission.SCHEDULE_EXACT_ALARM')) {
    manifest = manifest.replace(/<manifest([^>]*)>/, `<manifest$1>\n    ${permission}`);
    await writeFile(manifestPath, manifest);
    console.log('Permiso de alarmas exactas agregado a Android.');
  } else {
    console.log('Android ya tiene configurado el permiso de alarmas exactas.');
  }
} catch (error) {
  console.error('Primero genera Android con: npm run cap:add:android');
  process.exitCode = 1;
}
