"use client";

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TimeOffAllocationsManager from '../components/TimeOffAllocationsManager';
import TimeOffRequestsManager from '../components/TimeOffRequestsManager';
import { useAppContext } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import { TimeOffRequest, TimeOffAllocation } from '../types';
import { AppLayout } from '../AppLayout';
import { differenceInBusinessDays, parseISO } from 'date-fns';

export default function TimeOffPage() {
  const { currentUser, timeOffAllocations, timeOffRequests, fetchTimeOffAllocations, fetchTimeOffRequests, createTimeOffRequest } = useAppContext();
  const [tablesInitialized, setTablesInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState<Partial<TimeOffRequest>>({
    startDate: '',
    endDate: '',
    requestType: 'PTO',
    durationDays: 8,
    notes: ''
  });
  
  // Initialize the database tables when the page loads
  useEffect(() => {
    const initializeTables = async () => {
      try {
        const response = await fetch('/api/time-off/initialize-tables', {
          method: 'POST',
        });
        
        if (response.ok) {
          setTablesInitialized(true);
        } else {
          console.error('Failed to initialize time-off tables');
        }
      } catch (error) {
        console.error('Error initializing time-off tables:', error);
      }
    };

    initializeTables();
    
    // Fetch relevant data for the current user
    if (currentUser) {
      // Fetch all time-off allocations and requests if admin
      if (currentUser.isAdmin) {
        fetchTimeOffAllocations();
        fetchTimeOffRequests();
      } else {
        // Fetch only current user's data if regular employee
        fetchTimeOffAllocations(currentUser.id?.toString());
        fetchTimeOffRequests(currentUser.id?.toString());
      }
    }
  }, [currentUser, fetchTimeOffAllocations, fetchTimeOffRequests]);

  // Effect to calculate duration when start and end dates change
  useEffect(() => {
    if (newRequest.startDate && newRequest.endDate) {
      // Calculate working days between the two dates (excluding weekends)
      const start = parseISO(newRequest.startDate);
      const end = parseISO(newRequest.endDate);
      
      // Use differenceInBusinessDays to calculate working days (excludes weekends)
      let businessDays = differenceInBusinessDays(end, start) + 1; // +1 to include the end date
      
      // Handle case where the calculation might return negative value
      businessDays = Math.max(0, businessDays);
            
      setNewRequest(prev => ({ ...prev, durationDays: businessDays }));
    }
  }, [newRequest.startDate, newRequest.endDate]);

  // If no user is logged in
  if (!currentUser) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Not logged in!</strong>
            <span className="block sm:inline"> Please log in to access time-off features.</span>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Get the user's current allocation if available
  const currentYear = new Date().getFullYear();
  const userAllocation = timeOffAllocations.find(
    allocation => allocation.employeeId === currentUser.id && allocation.year === currentYear
  );
  
  // Get the user's requests
  const userRequests = currentUser.isAdmin 
    ? timeOffRequests 
    : timeOffRequests.filter(req => req.employeeId === currentUser.id);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewRequest(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser.id || !newRequest.startDate || !newRequest.endDate || !newRequest.requestType) {
      alert('Please fill out all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add employee ID to the request
      const completeRequest = {
        ...newRequest,
        employeeId: currentUser.id,
        status: 'pending'
      };
      
      // Submit the request
      await createTimeOffRequest(completeRequest);
      
      // Reset the form
      setNewRequest({
        startDate: '',
        endDate: '',
        requestType: 'PTO',
        durationDays: 8,
        notes: ''
      });
      
      // Refresh requests
      fetchTimeOffRequests(currentUser.id.toString());
      
    } catch (error) {
      console.error('Error submitting time-off request:', error);
      alert('Failed to submit time-off request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin view - full management interface
  if (currentUser.isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <h1 className="text-2xl font-bold mb-6">Time Off Management</h1>
          
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
            </TabsList>
            <TabsContent value="requests">
              <TimeOffRequestsManager />
            </TabsContent>
            <TabsContent value="allocations">
              <TimeOffAllocationsManager />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    );
  }
  
  // Employee view - request submission and history
  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">My Time Off</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                PTO Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {userAllocation ? userAllocation.ptoRemaining : 0} days
              </div>
              <p className="text-sm text-muted-foreground">
                of {userAllocation ? userAllocation.ptoTotal : 0} days available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Sick Leave Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {userAllocation ? userAllocation.sickDaysRemaining : 0} days
              </div>
              <p className="text-sm text-muted-foreground">
                of {userAllocation ? userAllocation.sickDaysTotal : 0} days available
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="bg-primary/10">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Request Time Off
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={newRequest.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={newRequest.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="requestType">Type</Label>
                    <Select 
                      value={newRequest.requestType} 
                      onValueChange={(value) => handleSelectChange('requestType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PTO">PTO</SelectItem>
                        <SelectItem value="Sick">Sick Leave</SelectItem>
                        <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="durationDays">Days (calculated automatically)</Label>
                    <Input 
                      id="durationDays"
                      name="durationDays"
                      type="number"
                      value={newRequest.durationDays || 0}
                      readOnly
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    {newRequest.startDate && newRequest.endDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {newRequest.durationDays === 0 
                          ? "No working days selected (weekend only or invalid date range)" 
                          : `${newRequest.durationDays} business day${newRequest.durationDays !== 1 ? 's' : ''} excluding weekends`}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input 
                      id="notes"
                      name="notes"
                      value={newRequest.notes || ''}
                      onChange={handleInputChange}
                      placeholder="Reason for request..."
                    />
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>My Request History</CardTitle>
          </CardHeader>
          <CardContent>
            {userRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Start Date</th>
                      <th className="text-left p-2">End Date</th>
                      <th className="text-left p-2">Days</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userRequests.map((request) => (
                      <tr key={request.id} className="border-b">
                        <td className="p-2">{request.requestType}</td>
                        <td className="p-2">{new Date(request.startDate).toLocaleDateString()}</td>
                        <td className="p-2">{new Date(request.endDate).toLocaleDateString()}</td>
                        <td className="p-2">{request.durationDays}</td>
                        <td className="p-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            request.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : request.status === 'denied'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No time-off requests found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}