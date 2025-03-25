"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Clock, User, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { User as UserType } from '../types';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface NavbarProps {
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
}

const Navbar = ({ currentUser, setCurrentUser }: NavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  // Determine the dashboard link based on user type
  const dashboardLink = currentUser?.isAdmin ? '/admin' : '/employee';
  
  // Check if a path is active
  const isActive = (path: string) => {
    if (path === dashboardLink) {
      return pathname === dashboardLink;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Clock className="h-6 w-6 text-foreground/80 mr-2" />
          <span className="font-bold text-foreground text-xl">HR System</span>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {currentUser ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                <User className="h-4 w-4 text-foreground/80" />
                <span className="text-foreground">{currentUser.name}</span>
              </div>
              <Link href={dashboardLink}>
                <Button 
                  variant={isActive(dashboardLink) ? "default" : "ghost"} 
                  size="sm" 
                  className="gap-1"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button 
                  variant={isActive('/settings') ? "default" : "ghost"} 
                  size="sm" 
                  className="gap-1"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline">Settings</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;