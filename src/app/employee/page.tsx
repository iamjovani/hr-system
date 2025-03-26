"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Clock, RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '../AppLayout';
import { useAppContext } from '../context/AppContext';
import { TimeRecord } from '../types';
import { DatePicker } from '@/components/ui/date-picker';
import { format, isValid, isSameDay } from 'date-fns';

export default function EmployeeDashboard() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const router = useRouter();
  
  const { 
    currentUser, 
    setCurrentUser, 
    clockIn, 
    clockOut, 
    timeRecords,
    isLoaded,
    fetchTimeRecords
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

  // Check clock status when timeRecords or currentUser changes
  useEffect(() => {
    checkClockStatus();
  }, [timeRecords, currentUser, checkClockStatus]);

  // Automatically fetch fresh time records once after login
  useEffect(() => {
    // Only run this effect once when the component is first loaded and user is logged in
    if (isLoaded && currentUser && !initialFetchDone && fetchTimeRecords) {
      const fetchInitialData = async () => {
        setIsRefreshing(true);
        try {
          await fetchTimeRecords(currentUser.id);
          // Update initialFetchDone to prevent further automatic fetches
          setInitialFetchDone(true);
          // Status will be updated automatically by the checkClockStatus effect
        } catch (error) {
          console.error('Error fetching initial time records:', error);
        } finally {
          setIsRefreshing(false);
        }
      };
      
      fetchInitialData();
    }
  }, [isLoaded, currentUser, initialFetchDone, fetchTimeRecords]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchDate]);

  // Function to toggle clock in/out based on current status
  const toggleClockStatus = async () => {
    if (isClockedIn) {
      await handleClockOut();
    } else {
      await handleClockIn();
    }
  };

  // Function to manually refresh time records
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
    
    // If already clocked in after refresh, show message and return
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
    
    // If not clocked in after refresh, show message and return
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

  // Clear date filter
  const clearDateFilter = () => {
    setSearchDate(undefined);
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

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Filter records for current user and sort by date (newest first)
  const filteredRecords: TimeRecord[] = currentUser 
    ? timeRecords
        .filter(record => {
          if (record.employeeId !== currentUser.id) return false;
          
          if (!searchDate) return true;
          
          // Filter by the selected date
          const recordDate = new Date(record.clockInTime);
          return isSameDay(recordDate, searchDate);
        })
        .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime())
    : [];

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  // Render pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    
    // Previous page button
    buttons.push(
      <Button 
        key="prev" 
        variant="outline" 
        size="sm" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );
    
    // Page number buttons
    const maxButtonsToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }
    
    // First page
    if (startPage > 1) {
      buttons.push(
        <Button 
          key="1" 
          variant={currentPage === 1 ? "default" : "outline"} 
          size="sm" 
          onClick={() => handlePageChange(1)}
        >
          1
        </Button>
      );
      
      // Ellipsis if needed
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2">...</span>
        );
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button 
          key={i} 
          variant={currentPage === i ? "default" : "outline"} 
          size="sm" 
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2">...</span>
        );
      }
      
      buttons.push(
        <Button 
          key={totalPages} 
          variant={currentPage === totalPages ? "default" : "outline"} 
          size="sm" 
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    // Next page button
    buttons.push(
      <Button 
        key="next" 
        variant="outline" 
        size="sm" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );
    
    return buttons;
  };

  if (!isLoaded || !currentUser) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <AppLayout>
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
              {/* Single button that changes based on current status */}
              <Button 
                size="lg"
                onClick={toggleClockStatus}
                disabled={isLoading || isRefreshing}
                className={isClockedIn 
                  ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 dark:text-white" 
                  : "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 dark:text-white"}
              >
                <Clock className="mr-2 h-5 w-5" /> 
                {isLoading ? 'Processing...' : (isClockedIn ? 'Clock Out' : 'Clock In')}
              </Button>
            </div>
            <div className="mt-4">
              <div className="text-sm font-medium mb-1">
                Status: <span className={isClockedIn 
                  ? "text-green-600 dark:text-green-500 font-bold" 
                  : "text-gray-600 dark:text-gray-400 font-medium"}>
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
            <div className="flex justify-between mb-6">
              {/* Date Picker Filter */}
              <div className="flex items-center gap-2">
                <div className="w-56">
                  <DatePicker 
                    date={searchDate} 
                    setDate={setSearchDate}
                  />
                </div>
                {searchDate && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearDateFilter}
                  >
                    Clear
                  </Button>
                )}
              </div>
              
              {/* Items per page selector */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="itemsPerPage">Show</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={handleItemsPerPageChange}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="5" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm">per page</span>
              </div>
            </div>

            {filteredRecords.length > 0 ? (
              <>
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
                    {currentItems.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Date(record.clockInTime).toLocaleDateString()}</TableCell>
                        <TableCell>{formatDate(record.clockInTime)}</TableCell>
                        <TableCell>
                          {record.clockOutTime ? formatDate(record.clockOutTime) : 
                            <span className="text-green-600 dark:text-green-500 font-medium">Active</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          {calcHoursWorked(record.clockInTime, record.clockOutTime)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Pagination controls */}
                {filteredRecords.length > 0 && (
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredRecords.length)} of {filteredRecords.length} records
                    </div>
                    <div className="flex space-x-2">
                      {renderPaginationButtons()}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {searchDate ? "No records found for the selected date." : "No time records found."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}