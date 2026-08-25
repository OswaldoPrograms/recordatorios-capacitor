package com.oswaldo.recordatorios;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.concurrent.Executor;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SecureVault")
public class SecureVaultPlugin extends Plugin {
    private static final String ALIAS = "recordatorios_secure_vault", PREFS = "secure_vault";
    private boolean unlocked = false;
    @PluginMethod public void status(PluginCall call) { boolean enabled = prefs().getBoolean("lock_enabled", false); JSObject result = new JSObject(); result.put("enabled", enabled); result.put("unlocked", !enabled || unlocked); call.resolve(result); }
    @PluginMethod public void authenticate(PluginCall call) {
        FragmentActivity activity = (FragmentActivity)getActivity(); Executor executor = ContextCompat.getMainExecutor(getContext());
        BiometricPrompt prompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) { super.onAuthenticationSucceeded(result); unlocked = true; JSObject response = new JSObject(); response.put("authenticated", true); call.resolve(response); }
            @Override public void onAuthenticationError(int code, CharSequence message) { super.onAuthenticationError(code, message); call.reject(message.toString()); }
        });
        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder().setTitle("Desbloquear Mi agenda").setSubtitle("Usa tu huella, rostro, PIN, patrón o contraseña").setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL).build();
        activity.runOnUiThread(() -> prompt.authenticate(info));
    }
    @PluginMethod public void setEnabled(PluginCall call) { boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false)); if (enabled && !unlocked) { call.reject("Primero autentícate para activar el bloqueo"); return; } prefs().edit().putBoolean("lock_enabled", enabled).apply(); if (!enabled) unlocked = true; call.resolve(); }
    @PluginMethod public void lock(PluginCall call) { if (prefs().getBoolean("lock_enabled", false)) unlocked = false; call.resolve(); }
    @PluginMethod public void store(PluginCall call) { if (!allowed(call)) return; try { put("api_key", call.getString("apiKey", "")); put("transcription_key", call.getString("transcriptionKey", "")); call.resolve(); } catch (Exception error) { call.reject("No se pudieron proteger las llaves", error); } }
    @PluginMethod public void read(PluginCall call) { if (!allowed(call)) return; try { JSObject result = new JSObject(); result.put("apiKey", get("api_key")); result.put("transcriptionKey", get("transcription_key")); call.resolve(result); } catch (Exception error) { call.reject("No se pudieron leer las llaves protegidas", error); } }
    private boolean allowed(PluginCall call) { if (prefs().getBoolean("lock_enabled", false) && !unlocked) { call.reject("La aplicación está bloqueada"); return false; } return true; }
    private android.content.SharedPreferences prefs() { return getContext().getSharedPreferences(PREFS, 0); }
    private SecretKey key() throws Exception { KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null); if (store.containsAlias(ALIAS)) return ((KeyStore.SecretKeyEntry)store.getEntry(ALIAS, null)).getSecretKey(); KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore"); generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build()); return generator.generateKey(); }
    private void put(String name, String value) throws Exception { Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key()); String packed = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" + Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP); prefs().edit().putString(name, packed).apply(); }
    private String get(String name) throws Exception { String packed = prefs().getString(name, null); if (packed == null || packed.isEmpty()) return ""; String[] parts = packed.split(":", 2); Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP))); return new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8); }
}
