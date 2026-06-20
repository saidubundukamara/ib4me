"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[200] bg-primary text-primary-foreground px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 animate-fade-in">
        <Wifi className="h-4 w-4" />
        Back online
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4 shrink-0" />
      You&apos;re offline — some features may not work. Check your connection.
    </div>
  );
}
