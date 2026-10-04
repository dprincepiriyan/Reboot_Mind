/**
 * Synchronous key/value storage that works on web and native.
 *
 * - Web: backed directly by localStorage (keeps existing browser sessions working).
 * - Native: backed by Capacitor Preferences (survives WebView cache clears).
 *   Preferences is async, so values are hydrated into an in-memory cache by
 *   `initStorage()` before the app renders; reads are then synchronous and
 *   writes are mirrored to Preferences in the background.
 */
import { Preferences } from '@capacitor/preferences';
import { isNative } from './platform';

/** All persisted keys live here so nothing is scattered across the codebase. */
export const StorageKeys = {
  token: 'mad_token', // kept for backward compatibility with existing web sessions
  serverUrl: 'rm_server_url',
  pleasureLogs: 'neuro_pleasure_logs',
} as const;

const cache = new Map<string, string>();
let initialized = false;

export async function initStorage(): Promise<void> {
  if (initialized) return;
  if (isNative()) {
    await Promise.all(
      Object.values(StorageKeys).map(async (key) => {
        const { value } = await Preferences.get({ key });
        if (value !== null) cache.set(key, value);
      }),
    );
  }
  initialized = true;
}

export const storage = {
  get(key: string): string | null {
    if (!isNative()) return localStorage.getItem(key);
    return cache.get(key) ?? null;
  },

  set(key: string, value: string): void {
    if (!isNative()) {
      localStorage.setItem(key, value);
      return;
    }
    cache.set(key, value);
    Preferences.set({ key, value }).catch((e) => console.error('storage.set failed', e));
  },

  remove(key: string): void {
    if (!isNative()) {
      localStorage.removeItem(key);
      return;
    }
    cache.delete(key);
    Preferences.remove({ key }).catch((e) => console.error('storage.remove failed', e));
  },
};
