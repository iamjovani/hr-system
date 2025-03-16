"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from './context/AppContext';

export default function Home() {
  const router = useRouter();
  const { currentUser, isLoaded } = useAppContext();

  useEffect(() => {
    if (!isLoaded) return;
    
    if (currentUser) {
      if (currentUser.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    } else {
      router.push('/login');
    }
  }, [currentUser, router, isLoaded]);

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-pulse">Loading...</div>
    </div>
  );
}