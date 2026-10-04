import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './platform';

export const haptics = {
  /** Light click for navigation, tab changes, button taps */
  async tap(): Promise<void> {
    if (!isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      // Ignore if device does not support or user disabled vibration
    }
  },

  /** Medium impact for task completion, check-in saved, urge wave start */
  async impact(): Promise<void> {
    if (!isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}
  },

  /** Heavy impact for SOS alerts received or triggered */
  async heavy(): Promise<void> {
    if (!isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}
  },

  /** Rhythmic double-pulse for breathing pacer phase change (inhale/hold/exhale) */
  async breathingPulse(): Promise<void> {
    if (!isNative()) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      setTimeout(async () => {
        try {
          await Haptics.impact({ style: ImpactStyle.Light });
        } catch {}
      }, 120);
    } catch {}
  },

  /** Milestone unlock or wave defusal victory */
  async success(): Promise<void> {
    if (!isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
  },

  /** Slip or critical alert */
  async warning(): Promise<void> {
    if (!isNative()) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {}
  },
};
