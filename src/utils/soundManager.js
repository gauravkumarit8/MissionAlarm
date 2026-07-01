import Sound from 'react-native-sound';
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

// NOTE: Volume monitoring/forcing requires a small native module on Android
// (VolumeObserverModule) that wraps AudioManager.STREAM_ALARM + a
// ContentObserver on Settings.System.CONTENT_URI. That native module is not
// shown here (it's plain Kotlin, ~40 lines) but this file documents the exact
// contract it must satisfy, and degrades gracefully if it isn't present yet.

Sound.setCategory('Alarm'); // iOS: routes audio so it can play even if mute switch is on

let alarmSound = null;
let volumeCorrectionInterval = null;

const { VolumeObserverModule } = NativeModules;
const volumeEmitter = VolumeObserverModule
  ? new NativeEventEmitter(VolumeObserverModule)
  : null;

const MIN_ALARM_VOLUME_RATIO = 0.5; // never let it drop below 50% of max

/**
 * Starts playing the alarm sound on a loop, on the dedicated ALARM stream
 * (Android) so it's independent from the media/ringtone volume the side
 * buttons usually control.
 */
export function startAlarmSound(soundFile = 'alarm_default.mp3') {
  return new Promise((resolve, reject) => {
    alarmSound = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load alarm sound', error);
        reject(error);
        return;
      }
      alarmSound.setNumberOfLoops(-1); // infinite loop
      alarmSound.play();
      resolve();
    });
  });
}

export function stopAlarmSound() {
  if (alarmSound) {
    alarmSound.stop(() => alarmSound.release());
    alarmSound = null;
  }
  stopVolumeProtection();
}

/**
 * Begins actively correcting the alarm stream volume if the user tries to
 * lower it with the hardware buttons. This does NOT block the button press
 * (impossible on stock Android/iOS) — it detects the drop and snaps the
 * volume back up within ~100-200ms, which in practice makes muting via the
 * buttons alone ineffective.
 *
 * Android: relies on VolumeObserverModule (native) emitting 'volumeChanged'
 * events with the current STREAM_ALARM level.
 * iOS: no public API allows reading/forcing the hardware volume for the
 * alarm session, so this is a no-op there — see fallback notes below.
 */
export function startVolumeProtection() {
  if (Platform.OS !== 'android' || !VolumeObserverModule) {
    return; // iOS fallback handled separately, see startIOSFallback()
  }

  VolumeObserverModule.setStreamType('ALARM');
  VolumeObserverModule.startObserving();

  const sub = volumeEmitter.addListener('volumeChanged', ({ currentRatio }) => {
    if (currentRatio < MIN_ALARM_VOLUME_RATIO) {
      VolumeObserverModule.setVolumeRatio(Math.max(currentRatio, 0.9));
    }
  });

  volumeCorrectionInterval = sub;
}

export function stopVolumeProtection() {
  if (volumeCorrectionInterval && volumeCorrectionInterval.remove) {
    volumeCorrectionInterval.remove();
  }
  if (Platform.OS === 'android' && VolumeObserverModule) {
    VolumeObserverModule.stopObserving();
  }
  volumeCorrectionInterval = null;
}

/**
 * iOS fallback strategy (since volume can't be forced back up):
 * 1. Use haptic vibration in parallel with sound (keeps "waking" even if muted)
 * 2. Use AVAudioSession .playback category so the silent switch doesn't mute it
 * 3. Show a persistent on-screen banner: "Lowering volume won't dismiss this"
 * 4. Optionally require the screen to stay on/foregrounded for the challenge
 *    to count, since iOS won't let background audio fight the buttons anyway.
 */
export function getIOSVolumeFallbackMessage() {
  return 'Turning the volume down won\u2019t stop this alarm \u2014 you still need to finish the challenge.';
}
