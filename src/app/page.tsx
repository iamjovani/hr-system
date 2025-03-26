"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from './context/AppContext';
import { AppLayout } from './AppLayout';

export default function Home() {
  const router = useRouter();
  const { currentUser } = useAppContext();

  useEffect(() => {
    // If the user is logged in, redirect them to the appropriate dashboard
    if (currentUser) {
      if (currentUser.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/employee');
      }
    } else {
      // If no user is logged in, redirect to login page
      router.push('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to Astrea System</h1>
        <p>Redirecting to the appropriate page...</p>
      </div>
    </div>
  );
}