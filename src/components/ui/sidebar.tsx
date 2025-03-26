"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  User, 
  Clock, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Users,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ThemeToggle } from './theme-toggle';
import { User as UserType } from '@/app/types';

interface SidebarProps {
  currentUser: UserType | null;
  setCurrentUser: (user: UserType | null) => void;
}

export function Sidebar({ currentUser, setCurrentUser }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const pathname = usePathname();

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
  };

  // Determine the dashboard link based on user type
  const dashboardLink = currentUser?.isAdmin ? '/admin' : '/employee';

  // Check if a path is active
  const isActive = (path: string) => {
    if (path === dashboardLink && pathname === dashboardLink) {
      return true;
    }
    return pathname.startsWith(path);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-background dark:bg-background border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
      collapsed ? "w-[70px]" : "w-[240px]"
    )}>
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <div className="flex items-center">
            <Clock className="h-6 w-6 text-gray-700 dark:text-gray-300 mr-2" />
            <span className="font-bold text-xl text-gray-900 dark:text-white">HR System</span>
          </div>
        )}
        {collapsed && (
          <Clock className="h-6 w-6 text-gray-700 dark:text-gray-300 mx-auto" />
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col flex-grow overflow-y-auto">
        {/* Main section label */}
        {!collapsed && (
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">MAIN</p>
          </div>
        )}

        {/* Main navigation items */}
        <nav className="flex flex-col gap-1 px-2">
          <NavItem 
            href={dashboardLink}
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={isActive(dashboardLink)}
            collapsed={collapsed}
          />
          
          {/* Comment out Messages for now
          <NavItem 
            href="/messages"
            icon={<MessageSquare size={20} />}
            label="Message"
            active={isActive('/messages')}
            collapsed={collapsed}
            badge={1}
          />
          */}
          
          {/* Employee dropdown */}
          {currentUser?.isAdmin && (
            <div>
              <button
                onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive('/employee/') || isActive('/admin/') ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" : 
                  "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Users size={20} />
                {!collapsed && (
                  <>
                    <span className="flex-grow text-left">Employee</span>
                    <ChevronRight 
                      size={16} 
                      className={cn(
                        "transition-transform", 
                        isEmployeeOpen && "transform rotate-90"
                      )} 
                    />
                  </>
                )}
              </button>
              
              {isEmployeeOpen && !collapsed && (
                <div className="ml-7 flex flex-col gap-1 mt-1">
                  <NavItem 
                    href="/admin"
                    label="Management"
                    active={isActive('/admin')}
                    collapsed={collapsed}
                    indented
                  />
                  {/* Comment out for now
                  <NavItem 
                    href="/employee/payroll"
                    label="Payroll"
                    active={isActive('/employee/payroll')}
                    collapsed={collapsed}
                    indented
                  />
                  */}
                  <NavItem 
                    href="/admin/attendance"
                    label="Attendance"
                    active={isActive('/admin/attendance')}
                    collapsed={collapsed}
                    indented
                  />
                  {/* Comment out for now
                  <NavItem 
                    href="/employee/statistics"
                    label="Statistics"
                    active={isActive('/employee/statistics')}
                    collapsed={collapsed}
                    indented
                  />
                  */}
                </div>
              )}
            </div>
          )}
          
          {!currentUser?.isAdmin && (
            <NavItem 
              href="/employee"
              icon={<ClipboardList size={20} />}
              label="Time Tracking"
              active={isActive('/employee')}
              collapsed={collapsed}
            />
          )}

          {/* Comment out for now
          <NavItem 
            href="/schedule"
            icon={<Calendar size={20} />}
            label="Schedule"
            active={isActive('/schedule')}
            collapsed={collapsed}
          />
          
          <NavItem 
            href="/reports"
            icon={<FileText size={20} />}
            label="Reports"
            active={isActive('/reports')}
            collapsed={collapsed}
          />
          */}
        </nav>

        {/* User section label */}
        {!collapsed && (
          <div className="px-4 pt-6 pb-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">USER</p>
          </div>
        )}

        {/* User navigation items */}
        <nav className="flex flex-col gap-1 px-2">
          {/* Comment out for now
          <NavItem 
            href="/profile"
            icon={<User size={20} />}
            label="Profile"
            active={isActive('/profile')}
            collapsed={collapsed}
          />
          */}
          
          <NavItem 
            href="/settings"
            icon={<Settings size={20} />}
            label="Settings"
            active={isActive('/settings')}
            collapsed={collapsed}
          />
          
          {/* Comment out for now
          <NavItem 
            href="/help"
            icon={<HelpCircle size={20} />}
            label="Help Center"
            active={isActive('/help')}
            collapsed={collapsed}
          />
          */}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        {/* Theme toggle */}
        <div className={collapsed ? "flex justify-center" : "hidden"}>
          <ThemeToggle />
        </div>
        
        {!collapsed && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700 dark:text-gray-300">Theme</span>
            <div className="flex gap-2">
              <button 
                className="px-4 py-1 rounded transition-colors text-sm bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => document.documentElement.classList.remove('dark')}
              >
                Light
              </button>
              <button 
                className="px-4 py-1 rounded transition-colors text-sm bg-transparent text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                onClick={() => document.documentElement.classList.add('dark')}
              >
                Dark
              </button>
            </div>
          </div>
        )}

        {/* Collapse button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleCollapsed} 
          className={cn(
            "w-full flex items-center gap-2 justify-center border border-gray-200 dark:border-gray-700",
            collapsed ? "px-0" : ""
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </Button>

        {/* User info and logout */}
        {currentUser && !collapsed && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 text-white flex items-center justify-center mr-2">
                {currentUser.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {currentUser.isAdmin ? 'Administrator' : 'Employee'}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className="w-full flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LogOut size={16} />
              <span>Log out</span>
            </Button>
          </div>
        )}

        {currentUser && collapsed && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleLogout} 
            className="w-full mt-4 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}

// Navigation item component
interface NavItemProps {
  href: string;
  icon?: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  indented?: boolean;
}

function NavItem({
  href,
  icon,
  label,
  active,
  collapsed,
  badge,
  indented = false
}: NavItemProps) {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    if (href === '/settings') {
      e.preventDefault();
      router.push(href);
    }
  };
  
  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors relative",
        active 
          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" 
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
        collapsed ? "justify-center" : "",
        indented && active && "border-l-2 border-gray-500 dark:border-gray-300 bg-gray-100 dark:bg-gray-800",
        indented && !active && "border-l-2 border-transparent"
      )}
    >
      {icon}
      
      {!collapsed && <span className="flex-grow">{label}</span>}
      
      {!collapsed && badge && (
        <span className="min-w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 text-white text-xs">
          {badge}
        </span>
      )}
      
      {collapsed && badge && (
        <span className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center rounded-full bg-gray-700 text-white text-xs">
          {badge}
        </span>
      )}
    </Link>
  );
}