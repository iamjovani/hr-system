"use client";

import { ReactNode } from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { useAppContext } from './context/AppContext';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentUser, setCurrentUser } = useAppContext();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black">
      <Sidebar currentUser={currentUser} setCurrentUser={setCurrentUser} />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
} 