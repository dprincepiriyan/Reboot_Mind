/**
 * Runtime-configurable backend address.
 *
 * Resolution order:
 *   1. URL saved by the user on the Connect screen (rm_server_url)
 *   2. VITE_API_URL baked in at build time (optional)
 *   3. Web only: '' = same origin (Vite proxy in dev, nginx in Docker)
 *   4. Native with nothing configured: null -> app shows the Connect screen
 */
import { storage, StorageKeys } from '../lib/storage';
import { isNative } from '../lib/platform';

export const SERVER_CHANGED_EVENT = 'rm:server-changed';
export const DEFAULT_BACKEND_PORT = 8000;

export function getServerUrl(): string | null {
  const saved = storage.get(StorageKeys.serverUrl);
  if (saved) return saved;
  const env = import.meta.env.VITE_API_URL;
  if (env) return normalizeServerUrl(env);
  return isNative() ? null : '';
}

export function isServerConfigured(): boolean {
  return getServerUrl() !== null;
}

export function setServerUrl(url: string): void {
  storage.set(StorageKeys.serverUrl, normalizeServerUrl(url));
  window.dispatchEvent(new Event(SERVER_CHANGED_EVENT));
}

export function clearServerUrl(): void {
  storage.remove(StorageKeys.serverUrl);
  window.dispatchEvent(new Event(SERVER_CHANGED_EVENT));
}

/**
 * Accepts loose input like "192.168.1.5", "192.168.1.5:8000",
 * "http://192.168.1.5:8000/api/" and returns "http://192.168.1.5:8000".
 */
export function normalizeServerUrl(input: string): string {
  let url = input.trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  url = url.replace(/\/+$/, '').replace(/\/api$/i, '');
  try {
    const parsed = new URL(url);
    if (!parsed.port && parsed.protocol === 'http:') parsed.port = String(DEFAULT_BACKEND_PORT);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}

/** Base for REST calls, e.g. "http://192.168.1.5:8000/api" or "/api" on web. */
export function getApiBase(): string {
  return `${getServerUrl() ?? ''}/api`;
}

/**
 * Socket.IO target. `undefined` means "same origin" (socket.io-client default).
 * Web dev on localhost talks to :8000 directly, matching the previous behaviour.
 */
export function getSocketUrl(): string | undefined {
  const server = getServerUrl();
  if (server) return server;
  const { protocol, hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:${DEFAULT_BACKEND_PORT}`;
  }
  return undefined;
}

export interface ServerCheckResult {
  ok: boolean;
  app?: string;
  error?: string;
}

/** Pings GET /api/health on the given server. */
export async function testServer(rawUrl: string, timeoutMs = 5000): Promise<ServerCheckResult> {
  const base = normalizeServerUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}/api/health`, { signal: controller.signal });
    if (!res.ok) return { ok: false, error: `Server responded with ${res.status}` };
    const data = await res.json().catch(() => ({}));
    if (data?.status !== 'ok') return { ok: false, error: 'Not a RebootMind server' };
    return { ok: true, app: data.app };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    return {
      ok: false,
      error: aborted
        ? 'Timed out. Is the PC on the same Wi-Fi and the firewall open?'
        : 'Could not reach server. Check the address and Wi-Fi.',
    };
  } finally {
    clearTimeout(timer);
  }
}
