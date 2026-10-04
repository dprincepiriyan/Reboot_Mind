import { Capacitor } from '@capacitor/core';

/** True when running inside the RebootMind Android (Capacitor) shell. */
export const isNative = (): boolean => Capacitor.isNativePlatform();

/** 'android' | 'ios' | 'web' */
export const platformName = (): string => Capacitor.getPlatform();
