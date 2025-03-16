"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Clock, User, LogOut } from 'lucide-react';
import { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
}

const Navbar = ({ currentUser, setCurrentUser }: NavbarProps) => {
  const router = useRouter();

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-black dark:text-white mr-2" />
          <span className="font-bold text-black dark:text-white text-xl">HR System</span>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <User className="h-4 w-4 text-black dark:text-white" />
              <span className="text-black dark:text-white">{currentUser.name}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 text-black dark:text-white mr-2" />
              Logout
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button size="sm">Login</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;