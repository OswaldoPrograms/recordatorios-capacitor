package com.oswaldo.recordatorios;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Alarm")
public class AlarmPlugin extends Plugin {
    @PluginMethod
    public void schedule(PluginCall call) {
        String taskId = call.getString("taskId");
        String title = call.getString("title", "Recordatorio");
        Long at = call.getLong("at");
        Long nextAt = call.getLong("nextAt", 0L);
        boolean repeating = Boolean.TRUE.equals(call.getBoolean("repeating", false));
        if (taskId == null || at == null) { call.reject("Faltan datos de la alarma"); return; }
        try {
            AlarmScheduler.schedule(getContext(), taskId, title, at, true, nextAt, repeating);
            JSObject result = new JSObject(); result.put("scheduled", true); call.resolve(result);
        } catch (SecurityException error) {
            call.reject("Android no ha autorizado las alarmas exactas", error);
        }
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String taskId = call.getString("taskId");
        if (taskId != null) AlarmScheduler.cancel(getContext(), taskId, true);
        call.resolve();
    }

    @PluginMethod
    public void consumeActions(PluginCall call) {
        android.content.SharedPreferences preferences = getContext().getSharedPreferences("alarm_actions", android.content.Context.MODE_PRIVATE);
        com.getcapacitor.JSArray actions = new com.getcapacitor.JSArray();
        for (java.util.Map.Entry<String, ?> entry : preferences.getAll().entrySet()) {
            try { actions.put(new org.json.JSONObject((String)entry.getValue())); } catch (Exception ignored) {}
        }
        preferences.edit().clear().apply();
        JSObject result = new JSObject(); result.put("actions", actions); call.resolve(result);
    }
}
