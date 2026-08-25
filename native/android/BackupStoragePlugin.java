package com.oswaldo.recordatorios;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.database.Cursor;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import androidx.activity.result.ActivityResult;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "BackupStorage")
public class BackupStoragePlugin extends Plugin {
    private static final String PREFS = "backup_storage", URI_KEY = "folder_uri", FILE_NAME = "recordatorios-respaldo.json";

    @PluginMethod public void chooseFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, intent, "folderChosen");
    }

    @ActivityCallback private void folderChosen(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) { call.reject("No se seleccionó una carpeta"); return; }
        Uri uri = data.getData();
        int flags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        try {
            getContext().getContentResolver().takePersistableUriPermission(uri, flags);
            getContext().getSharedPreferences(PREFS, 0).edit().putString(URI_KEY, uri.toString()).apply();
            JSObject response = new JSObject(); response.put("connected", true); call.resolve(response);
        } catch (Exception error) { call.reject("No se pudo conservar el acceso a la carpeta", error); }
    }

    @PluginMethod public void status(PluginCall call) { JSObject response = new JSObject(); response.put("connected", folderUri() != null); call.resolve(response); }

    @PluginMethod public void write(PluginCall call) {
        String content = call.getString("content"); Uri folder = folderUri();
        if (folder == null) { call.reject("No hay una carpeta conectada"); return; }
        if (content == null) { call.reject("Falta el contenido del respaldo"); return; }
        try {
            Uri file = findFile(folder);
            if (file == null) {
                Uri directory = DocumentsContract.buildDocumentUriUsingTree(folder, DocumentsContract.getTreeDocumentId(folder));
                file = DocumentsContract.createDocument(getContext().getContentResolver(), directory, "application/json", FILE_NAME);
            }
            if (file == null) { call.reject("No se pudo crear el archivo"); return; }
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(file, "wt")) { if (stream == null) throw new IllegalStateException(); stream.write(content.getBytes(StandardCharsets.UTF_8)); }
            JSObject response = new JSObject(); response.put("saved", true); response.put("savedAt", System.currentTimeMillis()); call.resolve(response);
        } catch (Exception error) { call.reject("No se pudo guardar el respaldo", error); }
    }

    @PluginMethod public void read(PluginCall call) {
        Uri folder = folderUri(); if (folder == null) { call.reject("No hay una carpeta conectada"); return; }
        try {
            Uri file = findFile(folder); if (file == null) { call.reject("Todavía no existe un respaldo en la carpeta"); return; }
            String content;
            try (InputStream stream = getContext().getContentResolver().openInputStream(file); ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
                if (stream == null) throw new IllegalStateException();
                byte[] buffer = new byte[8192]; int count;
                while ((count = stream.read(buffer)) != -1) bytes.write(buffer, 0, count);
                content = new String(bytes.toByteArray(), StandardCharsets.UTF_8);
            }
            JSObject response = new JSObject(); response.put("content", content); call.resolve(response);
        } catch (Exception error) { call.reject("No se pudo leer el respaldo", error); }
    }

    @PluginMethod public void disconnect(PluginCall call) {
        Uri uri = folderUri();
        if (uri != null) try { getContext().getContentResolver().releasePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION); } catch (Exception ignored) {}
        getContext().getSharedPreferences(PREFS, 0).edit().remove(URI_KEY).apply(); call.resolve();
    }

    private Uri folderUri() { String value = getContext().getSharedPreferences(PREFS, 0).getString(URI_KEY, null); return value == null ? null : Uri.parse(value); }
    private Uri findFile(Uri folder) throws Exception {
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(folder, DocumentsContract.getTreeDocumentId(folder));
        String[] columns = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor cursor = getContext().getContentResolver().query(children, columns, null, null, null)) {
            if (cursor == null) return null;
            while (cursor.moveToNext()) if (FILE_NAME.equals(cursor.getString(1))) return DocumentsContract.buildDocumentUriUsingTree(folder, cursor.getString(0));
        }
        return null;
    }
}
