package com.oswaldo.recordatorios;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.*;

public class AlarmActivity extends Activity {
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setShowWhenLocked(true); setTurnScreenOn(true);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        String id = getIntent().getStringExtra("taskId"), title = getIntent().getStringExtra("title");
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setGravity(Gravity.CENTER); layout.setPadding(48,48,48,48); layout.setBackgroundColor(Color.rgb(23,21,26));
        TextView label = new TextView(this); label.setText("TAREA PRIORITARIA"); label.setTextColor(Color.rgb(207,188,255)); label.setTextSize(15); label.setGravity(Gravity.CENTER);
        TextView heading = new TextView(this); heading.setText(title); heading.setTextColor(Color.WHITE); heading.setTextSize(32); heading.setGravity(Gravity.CENTER); heading.setPadding(0,30,0,50);
        Button stop = new Button(this); stop.setText("Detener alarma"); Button snooze = new Button(this); snooze.setText("Posponer 10 minutos");
        stop.setOnClickListener(v -> action("stop", id, title)); snooze.setOnClickListener(v -> action("snooze", id, title));
        layout.addView(label); layout.addView(heading); layout.addView(stop); layout.addView(snooze); setContentView(layout);
    }
    private void action(String action, String id, String title) {
        sendBroadcast(new Intent(this, AlarmActionReceiver.class).setAction(action).putExtra("taskId", id).putExtra("title", title));
        finishAndRemoveTask();
    }
}
