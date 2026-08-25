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
        if (taskId == null || at == null) { call.reject("Faltan datos de la alarma"); return; }
        try {
            AlarmScheduler.schedule(getContext(), taskId, title, at, true);
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
}
