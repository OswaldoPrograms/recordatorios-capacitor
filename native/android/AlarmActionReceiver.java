package com.oswaldo.recordatorios;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import org.json.JSONObject;

public class AlarmActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("taskId");
        String title = intent.getStringExtra("title");
        long nextAt=intent.getLongExtra("nextAt",0L);boolean repeating=intent.getBooleanExtra("repeating",false);String action=intent.getAction();
        context.stopService(new Intent(context, AlarmService.class));
        if (id == null) return;
        if ("snooze_10".equals(action)||"snooze_60".equals(action)) {
            long minutes="snooze_60".equals(action)?60L:10L;
            AlarmScheduler.schedule(context,id,title,System.currentTimeMillis()+minutes*60000L,true,nextAt,repeating);
            return;
        }
        try { context.getSharedPreferences("alarm_actions",Context.MODE_PRIVATE).edit().putString(id,new JSONObject().put("taskId",id).put("action",action).toString()).apply(); } catch(Exception ignored) {}
        if (repeating&&nextAt>System.currentTimeMillis()) AlarmScheduler.schedule(context,id,title,nextAt,true,0L,true);
        else AlarmScheduler.cancel(context,id,true);
    }
}
