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
  '<uses-permission android:name="android.permission.RECORD_AUDIO" />',
  '<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
  '<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />'
];
const components = `
        <provider android:name="androidx.core.content.FileProvider" android:authorities="\${applicationId}.fileprovider" android:exported="false" android:grantUriPermissions="true">
            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />
        </provider>
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
  if (!manifest.includes('.fileprovider')) manifest = manifest.replace('</application>', `        <provider android:name="androidx.core.content.FileProvider" android:authorities="\${applicationId}.fileprovider" android:exported="false" android:grantUriPermissions="true"><meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" /></provider>\n    </application>`);
  await writeFile(manifestPath, manifest);

  await mkdir(javaPath, { recursive: true });
  for (const file of ['AlarmPlugin.java','AlarmScheduler.java','AlarmReceiver.java','AlarmActionReceiver.java','AlarmService.java','AlarmActivity.java','BootReceiver.java','BackupStoragePlugin.java','SecureVaultPlugin.java','MicrophonePermissionPlugin.java'])
    await cp(`native/android/${file}`, `${javaPath}/${file}`);
  await mkdir('android/app/src/main/res/xml', { recursive: true });
  await cp('native/android/file_paths.xml', 'android/app/src/main/res/xml/file_paths.xml');

  let activity = await readFile(mainActivityPath, 'utf8');
  if (!activity.includes('registerPlugin(AlarmPlugin.class)')) {
    activity = activity.replace('import com.getcapacitor.BridgeActivity;', 'import com.getcapacitor.BridgeActivity;\nimport android.os.Bundle;');
    activity = activity.replace(/public class MainActivity extends BridgeActivity\s*\{[^}]*\}/s,
      'public class MainActivity extends BridgeActivity {\n    @Override public void onCreate(Bundle savedInstanceState) {\n        registerPlugin(AlarmPlugin.class);\n        registerPlugin(BackupStoragePlugin.class);\n        registerPlugin(SecureVaultPlugin.class);\n        registerPlugin(MicrophonePermissionPlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n}');
    await writeFile(mainActivityPath, activity);
  } else if (!activity.includes('registerPlugin(BackupStoragePlugin.class)')) {
    activity = activity.replace('registerPlugin(AlarmPlugin.class);', 'registerPlugin(AlarmPlugin.class);\n        registerPlugin(BackupStoragePlugin.class);');
    await writeFile(mainActivityPath, activity);
  }
  if (!activity.includes('registerPlugin(SecureVaultPlugin.class)')) {
    activity = activity.replace('registerPlugin(BackupStoragePlugin.class);', 'registerPlugin(BackupStoragePlugin.class);\n        registerPlugin(SecureVaultPlugin.class);');
    await writeFile(mainActivityPath, activity);
  }
  if (!activity.includes('registerPlugin(MicrophonePermissionPlugin.class)')) {
    activity = activity.replace('registerPlugin(SecureVaultPlugin.class);', 'registerPlugin(SecureVaultPlugin.class);\n        registerPlugin(MicrophonePermissionPlugin.class);');
    await writeFile(mainActivityPath, activity);
  }
  const gradlePath = 'android/app/build.gradle';
  let gradle = await readFile(gradlePath, 'utf8');
  if (!gradle.includes('androidx.biometric:biometric')) {
    gradle = gradle.replace('dependencies {', "dependencies {\n    implementation 'androidx.biometric:biometric:1.1.0'");
    await writeFile(gradlePath, gradle);
  }
  console.log('Alarma nativa de Android configurada.');
} catch (error) {
  console.error('No se pudo configurar Android:', error.message);
  console.error('Primero genera Android con: npm run cap:add:android');
  process.exitCode = 1;
}
