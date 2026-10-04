import { useEffect, useState } from 'react';
import { getServerUrl, SERVER_CHANGED_EVENT } from '../config/server';

/** Reactive view of the configured server URL (null = not configured on native). */
export function useServerUrl(): string | null {
  const [url, setUrl] = useState<string | null>(getServerUrl());
  useEffect(() => {
    const onChange = () => setUrl(getServerUrl());
    window.addEventListener(SERVER_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(SERVER_CHANGED_EVENT, onChange);
  }, []);
  return url;
}
