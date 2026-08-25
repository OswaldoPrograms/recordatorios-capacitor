package com.oswaldo.recordatorios;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class AlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        Intent service = new Intent(context, AlarmService.class)
            .putExtra("taskId", intent.getStringExtra("taskId"))
            .putExtra("title", intent.getStringExtra("title"));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(service);
        else context.startService(service);
    }
}
