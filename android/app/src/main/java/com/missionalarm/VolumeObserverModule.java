package com.missionalarm;

import android.content.Context;
import android.database.ContentObserver;
import android.media.AudioManager;
import android.os.Handler;
import android.provider.Settings;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class VolumeObserverModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private final AudioManager audioManager;
    private ContentObserver volumeObserver;
    private int streamType = AudioManager.STREAM_ALARM;

    public VolumeObserverModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
        this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
    }

    @Override
    public String getName() { return "VolumeObserverModule"; }

    @ReactMethod
    public void setStreamType(String name) { this.streamType = AudioManager.STREAM_ALARM; }

    @ReactMethod
    public void setVolumeRatio(double ratio) {
        int max = audioManager.getStreamMaxVolume(streamType);
        int target = (int) Math.round(max * ratio);
        try { audioManager.setStreamVolume(streamType, target, 0); }
        catch (SecurityException ignored) {}
    }

    @ReactMethod
    public void startObserving() {
        if (volumeObserver != null) return;
        setVolumeRatio(0.9);
        volumeObserver = new ContentObserver(new Handler()) {
            @Override
            public void onChange(boolean selfChange) {
                int current = audioManager.getStreamVolume(streamType);
                int max = audioManager.getStreamMaxVolume(streamType);
                double ratio = max == 0 ? 0 : (double) current / max;
                WritableMap payload = Arguments.createMap();
                payload.putDouble("currentRatio", ratio);
                emit("volumeChanged", payload);
            }
        };
        reactContext.getContentResolver().registerContentObserver(
            Settings.System.CONTENT_URI, true, volumeObserver);
    }

    @ReactMethod
    public void stopObserving() {
        if (volumeObserver != null) {
            reactContext.getContentResolver().unregisterContentObserver(volumeObserver);
            volumeObserver = null;
        }
    }

    private void emit(String eventName, WritableMap params) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }

    @ReactMethod public void addListener(String eventName) {}
    @ReactMethod public void removeListeners(Integer count) {}
}
