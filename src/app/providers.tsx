"use client"

import { ReactNode } from 'react';
import { AppProvider } from './context/AppContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <AppProvider>{children}</AppProvider>;
}