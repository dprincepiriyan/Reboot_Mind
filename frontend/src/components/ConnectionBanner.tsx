import React, { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { isNative } from '../lib/platform';
import { getServerUrl, testServer } from '../config/server';

export const ConnectionBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [serverReachable, setServerReachable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    const serverUrl = getServerUrl();
    if (!serverUrl) {
      setIsChecking(false);
      return;
    }
    const res = await testServer(serverUrl, 3000);
    setServerReachable(res.ok);
    setIsChecking(false);
  };

  useEffect(() => {
    if (isNative()) {
      Network.getStatus().then((status) => setIsOnline(status.connected));
      const listener = Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
        if (status.connected) checkConnection();
      });
      return () => {
        listener.then((l) => l.remove());
      };
    } else {
      const handleOnline = () => {
        setIsOnline(true);
        checkConnection();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (isOnline && serverReachable) return null;

  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 text-xs text-amber-200 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>No Wi-Fi or Internet connection</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Host PC server unreachable. Is PC on this Wi-Fi?</span>
          </>
        )}
      </div>
      <button
        onClick={checkConnection}
        disabled={isChecking}
        className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold text-amber-100 transition-colors"
      >
        <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
        <span>Retry</span>
      </button>
    </div>
  );
};
