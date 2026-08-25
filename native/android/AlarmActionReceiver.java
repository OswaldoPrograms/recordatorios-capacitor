package com.oswaldo.recordatorios;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AlarmActionReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        String id = intent.getStringExtra("taskId");
        String title = intent.getStringExtra("title");
        context.stopService(new Intent(context, AlarmService.class));
        if ("snooze".equals(intent.getAction()) && id != null)
            AlarmScheduler.schedule(context, id, title, System.currentTimeMillis() + 10 * 60 * 1000L, true);
        else if (id != null) AlarmScheduler.cancel(context, id, true);
    }
}
