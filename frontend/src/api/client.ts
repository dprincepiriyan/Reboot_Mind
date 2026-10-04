import { getApiBase, getServerUrl } from '../config/server';
import { authStorage } from '../lib/authStorage';

const REQUEST_TIMEOUT_MS = 10000;

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal ?? controller.signal,
    });
  } catch {
    // Network failure / timeout: the server is unreachable on the LAN.
    const where = getServerUrl() || 'the server';
    throw new Error(`Can't reach ${where}. Check your Wi-Fi and server address.`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401) {
    // App listens for this and routes to /login (no hard page reload).
    authStorage.clearToken();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(errorData.detail || 'Request failed');
  }

  return response.json();
}
