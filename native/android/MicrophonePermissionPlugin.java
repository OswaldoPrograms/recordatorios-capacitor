package com.oswaldo.recordatorios;

import android.Manifest;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(name = "MicrophonePermission", permissions = {
    @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
})
public class MicrophonePermissionPlugin extends Plugin {
    @PluginMethod public void check(PluginCall call) { resolveState(call); }
    @PluginMethod public void request(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) resolveState(call);
        else requestPermissionForAlias("microphone", call, "permissionResult");
    }
    @PermissionCallback private void permissionResult(PluginCall call) { resolveState(call); }
    private void resolveState(PluginCall call) {
        JSObject result = new JSObject(); result.put("granted", getPermissionState("microphone") == PermissionState.GRANTED); call.resolve(result);
    }
}
