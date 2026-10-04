/**
 * Screen Wake Lock API wrapper.
 * Keeps the screen awake during the 10-15 minute Urge Surfing timer
 * and Somatic Breathing Pacer so the display doesn't dim or lock.
 */

let wakeLockSentinel: any = null;

export const wakeLock = {
  async request(): Promise<boolean> {
    try {
      if ('wakeLock' in navigator) {
        wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
        return true;
      }
    } catch (e) {
      console.debug('WakeLock not granted or supported:', e);
    }
    return false;
  },

  async release(): Promise<void> {
    try {
      if (wakeLockSentinel) {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
      }
    } catch {}
  },
};
