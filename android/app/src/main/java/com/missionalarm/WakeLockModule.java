package com.missionalarm;

import android.content.Context;
import android.os.PowerManager;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class WakeLockModule extends ReactContextBaseJavaModule {
    private PowerManager.WakeLock wakeLock;
    private final ReactApplicationContext reactContext;

    public WakeLockModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() { return "WakeLockModule"; }

    @ReactMethod
    public void acquire() {
        try {
            PowerManager pm = (PowerManager) reactContext.getSystemService(Context.POWER_SERVICE);
            if (wakeLock == null) {
                wakeLock = pm.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "MissionAlarm::AlarmWakeLock"
                );
                wakeLock.acquire(10 * 60 * 1000L);
            }
        } catch (Exception e) { e.printStackTrace(); }
    }

    @ReactMethod
    public void release() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
                wakeLock = null;
            }
        } catch (Exception e) { e.printStackTrace(); }
    }
}
