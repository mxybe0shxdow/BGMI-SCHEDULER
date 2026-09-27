import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="bg-amber-600/90 text-white text-xs px-4 py-1.5 flex items-center justify-center gap-2 text-center sticky top-0 z-50 backdrop-blur-sm shadow-md animate-fadeIn">
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>
        <strong>You are offline:</strong> BGMI Squad Scheduler is operating in offline mode. Cached data is available.
      </span>
    </div>
  );
};
