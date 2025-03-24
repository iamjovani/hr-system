"use client"

import { ReactNode, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { initAutoClockOutScheduler, stopAutoClockOutScheduler } from '@/lib/autoClockOutScheduler';
import { config } from '@/lib/config';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Initialize the auto clock-out scheduler when the app starts
  useEffect(() => {
    // Only run on the client side, and only if enabled in config
    if (typeof window !== 'undefined' && config.autoClockOut.enabled) {
      initAutoClockOutScheduler();
      
      // Clean up when component unmounts
      return () => {
        stopAutoClockOutScheduler();
      };
    }
  }, []);
  
  return <AppProvider>{children}</AppProvider>;
}