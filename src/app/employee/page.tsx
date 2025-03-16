"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Clock, RefreshCw } from 'lucide-react';
import Navbar from '../component/Navbar';
import { useAppContext } from '../context/AppContext';
import { TimeRecord } from '../types';

export default function EmployeeDashboard() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { 
    currentUser, 
    setCurrentUser, 
    clockIn, 
    clockOut, 
    timeRecords,
    isLoaded,
    fetchTimeRecords // Assuming you've added this to AppContext
  } = useAppContext();

  // Redirect if not logged in
  useEffect(() => {
    if (isLoaded && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router, isLoaded]);

  // Function to check clock status - made reusable
  const checkClockStatus = useCallback(() => {
    if (currentUser) {
      const openRecord = timeRecords.find(
        record => record.employeeId === currentUser.id && !record.clockOutTime
      );
      setIsClockedIn(!!openRecord);
      return !!openRecord;
    }
    return false;
  }, [timeRecords, currentUser]);

  // Check if already clocked in on component mount and when dependencies change
  useEffect(() => {
    checkClockStatus();
  }, [timeRecords, currentUser, checkClockStatus]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Refresh time records from server periodically (every 5 minutes)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (currentUser) {
        refreshTimeRecords(false);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [currentUser]);

  // Function to refresh time records
  const refreshTimeRecords = async (showToast = true) => {
    if (!currentUser) return;
    
    setIsRefreshing(true);
    try {
      if (fetchTimeRecords) {
        await fetchTimeRecords(currentUser.id);
        
        // Re-check clock status after refresh
        const isCurrentlyClocked = checkClockStatus();
        
        if (showToast) {
          toast.success(`Status refreshed: ${isCurrentlyClocked ? 'Currently clocked in' : 'Not clocked in'}`);
        }
      }
    } catch (error) {
      console.error('Error refreshing time records:', error);
      if (showToast) {
        toast.error('Failed to refresh status');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClockIn = async () => {
    if (!currentUser) return;
    
    // Double-check status before clocking in
    await refreshTimeRecords(false);
    if (checkClockStatus()) {
      toast.error('You are already clocked in');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await clockIn(currentUser.id);
      if (result.success) {
        setIsClockedIn(true);
        toast.success(`Clocked in: ${result.message}`);
      } else {
        toast.error(`Clock in failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Clock in error:', error);
      toast.error('Failed to clock in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!currentUser) return;
    
    // Double-check status before clocking out
    await refreshTimeRecords(false);
    if (!checkClockStatus()) {
      toast.error('You are not currently clocked in');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await clockOut(currentUser.id);
      if (result.success) {
        setIsClockedIn(false);
        toast.success(`Clocked out: ${result.message}`);
      } else {
        toast.error(`Clock out failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Clock out error:', error);
      toast.error('Failed to clock out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  // Calculate hours worked
  const calcHoursWorked = (clockInTime: string, clockOutTime: string | null) => {
    if (!clockOutTime) return 'In progress';
    const hours = (new Date(clockOutTime).getTime() - new Date(clockInTime).getTime()) / (1000 * 60 * 60);
    return hours.toFixed(2);
  };

  // Filter records for current user and sort by date (newest first)
  const userRecords: TimeRecord[] = currentUser 
    ? timeRecords
        .filter(record => record.employeeId === currentUser.id)
        .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime())
    : [];

  if (!isLoaded || !currentUser) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
      <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <div className="container mx-auto p-4 space-y-6">
        <Card className="w-full">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Employee Dashboard</CardTitle>
                <CardDescription>Welcome, {currentUser.name} (ID: {currentUser.id})</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshTimeRecords(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <div className="text-3xl font-bold mb-2">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-md text-muted-foreground mb-4">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="flex justify-center gap-4">
              <Button 
                size="lg"
                onClick={handleClockIn}
                disabled={isClockedIn || isLoading || isRefreshing}
                className={!isClockedIn ? "bg-green-600 hover:bg-green-700" : ""}
              >
                <Clock className="mr-2 h-5 w-5" /> 
                {isLoading ? 'Processing...' : 'Clock In'}
              </Button>
              <Button 
                size="lg" 
                onClick={handleClockOut}
                disabled={!isClockedIn || isLoading || isRefreshing}
                className={isClockedIn ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <Clock className="mr-2 h-5 w-5" /> 
                {isLoading ? 'Processing...' : 'Clock Out'}
              </Button>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium mb-1">
                Status: <span className={isClockedIn ? "text-green-600 font-bold" : "text-gray-600 font-medium"}>
                  {isClockedIn ? 'Currently clocked in' : 'Not clocked in'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Last checked: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Time Records</CardTitle>
            <CardDescription>Recent activity</CardDescription>
          </CardHeader>
          <CardContent>
            {userRecords.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Clock In</TableHead>
                    <TableHead>Clock Out</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.clockInTime).toLocaleDateString()}</TableCell>
                      <TableCell>{formatDate(record.clockInTime)}</TableCell>
                      <TableCell>
                        {record.clockOutTime ? formatDate(record.clockOutTime) : 
                          <span className="text-green-600 font-medium">Active</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {calcHoursWorked(record.clockInTime, record.clockOutTime)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No time records found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}