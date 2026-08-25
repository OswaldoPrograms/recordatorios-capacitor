import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
const javaPath = 'android/app/src/main/java/com/oswaldo/recordatorios';
const mainActivityPath = `${javaPath}/MainActivity.java`;
const permissions = [
  '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
  '<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />',
  '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />'
];
const components = `
        <!-- Alarma nativa para tareas de prioridad alta -->
        <activity android:name=".AlarmActivity" android:exported="false" android:showWhenLocked="true" android:turnScreenOn="true" android:excludeFromRecents="true" android:theme="@style/AppTheme.NoActionBar" />
        <service android:name=".AlarmService" android:exported="false" android:foregroundServiceType="mediaPlayback" />
        <receiver android:name=".AlarmReceiver" android:exported="false" />
        <receiver android:name=".AlarmActionReceiver" android:exported="false" />
        <receiver android:name=".BootReceiver" android:enabled="true" android:exported="true">
            <intent-filter><action android:name="android.intent.action.BOOT_COMPLETED" /></intent-filter>
        </receiver>
`;

try {
  let manifest = await readFile(manifestPath, 'utf8');
  for (const permission of permissions) {
    const name = permission.match(/android\.permission\.[A-Z_]+/)?.[0];
    if (name && !manifest.includes(name)) manifest = manifest.replace(/<manifest([^>]*)>/, `<manifest$1>\n    ${permission}`);
  }
  if (!manifest.includes('.AlarmService')) manifest = manifest.replace('</application>', `${components}\n    </application>`);
  await writeFile(manifestPath, manifest);

  await mkdir(javaPath, { recursive: true });
  for (const file of ['AlarmPlugin.java','AlarmScheduler.java','AlarmReceiver.java','AlarmActionReceiver.java','AlarmService.java','AlarmActivity.java','BootReceiver.java','BackupStoragePlugin.java'])
    await cp(`native/android/${file}`, `${javaPath}/${file}`);

  let activity = await readFile(mainActivityPath, 'utf8');
  if (!activity.includes('registerPlugin(AlarmPlugin.class)')) {
    activity = activity.replace('import com.getcapacitor.BridgeActivity;', 'import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;');
    activity = activity.replace(/public class MainActivity extends BridgeActivity\s*\{[^}]*\}/s,
      'public class MainActivity extends BridgeActivity {\n    @Override public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(AlarmPlugin.class);\n        registerPlugin(BackupStoragePlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n}');
    await writeFile(mainActivityPath, activity);
  } else if (!activity.includes('registerPlugin(BackupStoragePlugin.class)')) {
    activity = activity.replace('registerPlugin(AlarmPlugin.class);', 'registerPlugin(AlarmPlugin.class);\n        registerPlugin(BackupStoragePlugin.class);');
    await writeFile(mainActivityPath, activity);
  }
  console.log('Alarma nativa de Android configurada.');
} catch (error) {
  console.error('No se pudo configurar Android:', error.message);
  console.error('Primero genera Android con: npm run cap:add:android');
  process.exitCode = 1;
}
