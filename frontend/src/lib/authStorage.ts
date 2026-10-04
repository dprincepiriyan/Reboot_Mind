import { storage, StorageKeys } from './storage';

/** Fired when the session ends (logout or 401) so the app can reset state. */
export const AUTH_CHANGED_EVENT = 'rm:auth-changed';

export const authStorage = {
  getToken(): string | null {
    return storage.get(StorageKeys.token);
  },

  setToken(token: string): void {
    storage.set(StorageKeys.token, token);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },

  clearToken(): void {
    storage.remove(StorageKeys.token);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  },
};
