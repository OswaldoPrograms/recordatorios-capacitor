package com.oswaldo.recordatorios;

import android.app.*;
import android.content.Intent;
import android.graphics.Color;
import android.media.*;
import android.net.Uri;
import android.os.*;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    private MediaPlayer player;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String id = intent.getStringExtra("taskId");
        String title = intent.getStringExtra("title");
        createChannel();
        startForeground(9001, notification(id, title));
        startSound();
        handler.postDelayed(this::stopSelf, 10 * 60 * 1000L);
        return START_NOT_STICKY;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel("alarm_clock", "Alarmas prioritarias", NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Alarmas de tareas con prioridad alta"); channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0,700,400,700}); channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            getSystemService(NotificationManager.class).createNotificationChannel(channel);
        }
    }

    private Notification notification(String id, String title) {
        Intent screen = new Intent(this, AlarmActivity.class).putExtra("taskId", id).putExtra("title", title).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent full = PendingIntent.getActivity(this, AlarmScheduler.requestCode(id + ":full"), screen, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Intent stop = new Intent(this, AlarmActionReceiver.class).setAction("stop").putExtra("taskId", id).putExtra("title", title);
        Intent snooze = new Intent(this, AlarmActionReceiver.class).setAction("snooze").putExtra("taskId", id).putExtra("title", title);
        PendingIntent stopAction = PendingIntent.getBroadcast(this, AlarmScheduler.requestCode(id + ":stop"), stop, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        PendingIntent snoozeAction = PendingIntent.getBroadcast(this, AlarmScheduler.requestCode(id + ":snooze"), snooze, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new NotificationCompat.Builder(this, "alarm_clock").setSmallIcon(getApplicationInfo().icon).setColor(Color.rgb(103,80,164))
            .setContentTitle(title).setContentText("Tarea de prioridad alta").setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_MAX).setVisibility(NotificationCompat.VISIBILITY_PUBLIC).setOngoing(true)
            .setFullScreenIntent(full, true).setContentIntent(full).addAction(0, "Detener", stopAction).addAction(0, "Posponer 10 min", snoozeAction).build();
    }

    private void startSound() {
        try {
            Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            player = new MediaPlayer(); player.setDataSource(this, uri);
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            player.setLooping(true); player.prepare(); player.start();
        } catch (Exception ignored) {}
        vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
        long[] pattern = {0,700,400,700};
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
        else vibrator.vibrate(pattern, 0);
    }

    @Override public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (player != null) { player.stop(); player.release(); }
        if (vibrator != null) vibrator.cancel();
        super.onDestroy();
    }
    @Override public android.os.IBinder onBind(Intent intent) { return null; }
}
