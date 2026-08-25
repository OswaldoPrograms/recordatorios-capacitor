package com.oswaldo.recordatorios;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.util.Map;

public final class AlarmScheduler {
    private static final String STORE = "high_priority_alarms";
    private AlarmScheduler() {}

    static int requestCode(String id) { return id.hashCode() & 0x7fffffff; }

    public static void schedule(Context context, String id, String title, long at, boolean persist) {
        Intent fire = new Intent(context, AlarmReceiver.class).putExtra("taskId", id).putExtra("title", title);
        PendingIntent operation = PendingIntent.getBroadcast(context, requestCode(id), fire, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent show = new Intent(context, AlarmActivity.class).putExtra("taskId", id).putExtra("title", title);
        PendingIntent showIntent = PendingIntent.getActivity(context, requestCode(id + ":show"), show, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        manager.setAlarmClock(new AlarmManager.AlarmClockInfo(at, showIntent), operation);
        if (persist) {
            try {
                JSONObject value = new JSONObject().put("id", id).put("title", title).put("at", at);
                context.getSharedPreferences(STORE, Context.MODE_PRIVATE).edit().putString(id, value.toString()).apply();
            } catch (Exception ignored) {}
        }
    }

    public static void cancel(Context context, String id, boolean remove) {
        Intent fire = new Intent(context, AlarmReceiver.class);
        PendingIntent operation = PendingIntent.getBroadcast(context, requestCode(id), fire, PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (operation != null) { manager.cancel(operation); operation.cancel(); }
        if (remove) context.getSharedPreferences(STORE, Context.MODE_PRIVATE).edit().remove(id).apply();
    }

    public static void restore(Context context) {
        SharedPreferences preferences = context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        for (Map.Entry<String, ?> entry : preferences.getAll().entrySet()) {
            try {
                JSONObject value = new JSONObject((String) entry.getValue());
                long at = value.getLong("at");
                if (at > System.currentTimeMillis()) schedule(context, value.getString("id"), value.getString("title"), at, false);
                else preferences.edit().remove(entry.getKey()).apply();
            } catch (Exception ignored) {}
        }
    }
}
