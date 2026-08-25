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
        String id = getIntent().getStringExtra("taskId"), title = getIntent().getStringExtra("title"); long nextAt=getIntent().getLongExtra("nextAt",0L); boolean repeating=getIntent().getBooleanExtra("repeating",false);
        LinearLayout layout = new LinearLayout(this); layout.setOrientation(LinearLayout.VERTICAL); layout.setGravity(Gravity.CENTER); layout.setPadding(48,48,48,48); layout.setBackgroundColor(Color.rgb(23,21,26));
        TextView label = new TextView(this); label.setText("TAREA PRIORITARIA"); label.setTextColor(Color.rgb(207,188,255)); label.setTextSize(15); label.setGravity(Gravity.CENTER);
        TextView heading = new TextView(this); heading.setText(title); heading.setTextColor(Color.WHITE); heading.setTextSize(32); heading.setGravity(Gravity.CENTER); heading.setPadding(0,30,0,50);
        Button complete = new Button(this); complete.setText("Completar tarea"); Button snooze = new Button(this); snooze.setText("Posponer 10 minutos"); Button snoozeHour=new Button(this);snoozeHour.setText("Posponer 1 hora");Button skip=new Button(this);skip.setText("Omitir esta repetición");skip.setVisibility(repeating?android.view.View.VISIBLE:android.view.View.GONE);
        complete.setOnClickListener(v -> action("complete", id, title,nextAt,repeating)); snooze.setOnClickListener(v -> action("snooze_10", id, title,nextAt,repeating));snoozeHour.setOnClickListener(v->action("snooze_60",id,title,nextAt,repeating));skip.setOnClickListener(v->action("skip",id,title,nextAt,repeating));
        layout.addView(label); layout.addView(heading); layout.addView(complete); layout.addView(snooze);layout.addView(snoozeHour);layout.addView(skip); setContentView(layout);
    }
    private void action(String action, String id, String title,long nextAt,boolean repeating) {
        sendBroadcast(new Intent(this, AlarmActionReceiver.class).setAction(action).putExtra("taskId", id).putExtra("title", title).putExtra("nextAt",nextAt).putExtra("repeating",repeating));
        finishAndRemoveTask();
    }
}
