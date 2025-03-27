"use client";

import { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, isWeekend, isBefore, isValid } from "date-fns";
import { useAppContext } from "../context/AppContext";
import { TimeOffRequestType } from "../types";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

export default function TimeOffRequestForm() {
  const { 
    currentUser, 
    timeOffAllocations, 
    createTimeOffRequest,
    calculateDaysInDateRange,
    wouldExceedQuota
  } = useAppContext();

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [requestType, setRequestType] = useState<TimeOffRequestType>('PTO');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [daysCount, setDaysCount] = useState(0);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [quota, setQuota] = useState({ 
    ptoRemaining: 0,
    sickDaysRemaining: 0
  });

  // Update quota information when user or request type changes
  useEffect(() => {
    if (currentUser) {
      const allocation = timeOffAllocations.find(a => a.employeeId === currentUser.id);
      if (allocation) {
        setQuota({
          ptoRemaining: allocation.ptoRemaining,
          sickDaysRemaining: allocation.sickDaysRemaining
        });
        
        // Set days remaining based on request type
        if (requestType === 'PTO') {
          setDaysRemaining(allocation.ptoRemaining);
        } else if (requestType === 'Sick') {
          setDaysRemaining(allocation.sickDaysRemaining);
        } else {
          // For Unpaid or Other, no limit applies
          setDaysRemaining(999);
        }
      }
    }
  }, [currentUser, timeOffAllocations, requestType]);

  // Recalculate days when dates change
  useEffect(() => {
    if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
      try {
        // Calculate business days between the selected dates (excluding weekends)
        const days = calculateDaysInDateRange(startDate, endDate);
        setDaysCount(days);
        
        // Update remaining days based on request type and quota
        if (currentUser && (requestType === 'PTO' || requestType === 'Sick')) {
          const allocation = timeOffAllocations.find(a => a.employeeId === currentUser.id);
          if (allocation) {
            const totalRemaining = requestType === 'PTO' ? allocation.ptoRemaining : allocation.sickDaysRemaining;
            const remainingAfterRequest = Math.max(0, totalRemaining - days);
            setDaysRemaining(remainingAfterRequest);
          }
        }
      } catch (error) {
        console.error("Error calculating days:", error);
        toast.error("Error calculating time off days");
        setDaysCount(0);
      }
    } else {
      setDaysCount(0);
      
      // Reset days remaining to original quota when no dates are selected
      if (currentUser && (requestType === 'PTO' || requestType === 'Sick')) {
        const allocation = timeOffAllocations.find(a => a.employeeId === currentUser.id);
        if (allocation) {
          const totalRemaining = requestType === 'PTO' ? allocation.ptoRemaining : allocation.sickDaysRemaining;
          setDaysRemaining(totalRemaining);
        }
      }
    }
  }, [startDate, endDate, calculateDaysInDateRange, currentUser, timeOffAllocations, requestType]);

  // Update request type handler - recalculates available days
  const handleRequestTypeChange = (value: string) => {
    const newRequestType = value as TimeOffRequestType;
    setRequestType(newRequestType);
    
    // Reset end date when changing request type to force recalculation
    setEndDate(undefined);
    
    // Update days remaining based on new request type
    if (currentUser) {
      const allocation = timeOffAllocations.find(a => a.employeeId === currentUser.id);
      if (allocation) {
        if (newRequestType === 'PTO') {
          setDaysRemaining(allocation.ptoRemaining);
        } else if (newRequestType === 'Sick') {
          setDaysRemaining(allocation.sickDaysRemaining);
        } else {
          // For Unpaid or Other, no limit applies
          setDaysRemaining(999);
        }
      }
    }
  };

  // Check if a date should be disabled based on quota
  const isDateDisabled = (date: Date) => {
    if (isWeekend(date)) return true;
    
    // If this is the first date being selected, we can't do a full calculation yet
    if (!startDate || !isValid(startDate)) return false;
      
    // If this is the end date selection and it's before start date
    if (startDate && isBefore(date, startDate)) return true;
    
    // For unpaid or other, no quota limit applies
    if (requestType === 'Unpaid' || requestType === 'Other') return false;
    
    // Calculate how many days would be used if this was the end date
    if (currentUser) {
      const { exceedsQuota } = wouldExceedQuota(
        currentUser.id,
        requestType,
        startDate,
        date
      );
      return exceedsQuota;
    }
    
    return false;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("You must be logged in to submit a request");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (isBefore(endDate, startDate)) {
      toast.error("End date cannot be before start date");
      return;
    }

    if (daysCount === 0) {
      toast.error("Your selection doesn't include any working days");
      return;
    }

    // Final quota check before submission
    if (requestType === 'PTO' || requestType === 'Sick') {
      const { exceedsQuota, remainingDays } = wouldExceedQuota(
        currentUser.id,
        requestType,
        startDate,
        endDate
      );

      if (exceedsQuota) {
        toast.error(`You only have ${remainingDays} ${requestType} days remaining`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await createTimeOffRequest({
        employeeId: currentUser.id,
        requestType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        durationDays: daysCount,
        notes,
        status: 'pending'
      });

      toast.success("Time off request submitted successfully");
      
      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setRequestType('PTO');
      setNotes('');
    } catch (error) {
      console.error('Error submitting time off request:', error);
      toast.error("Failed to submit time off request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Time Off</CardTitle>
        <CardDescription>
          Submit a new time off request for approval
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Request Type */}
          <div className="space-y-1">
            <Label htmlFor="request-type">Request Type</Label>
            <Select 
              value={requestType} 
              onValueChange={handleRequestTypeChange}
            >
              <SelectTrigger id="request-type">
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PTO">Paid Time Off (PTO)</SelectItem>
                <SelectItem value="Sick">Sick Leave</SelectItem>
                <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="start-date">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (endDate && date && isBefore(endDate, date)) {
                        setEndDate(undefined);
                      }
                    }}
                    disabled={(date) => 
                      isWeekend(date) || 
                      isBefore(date, new Date())
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label htmlFor="end-date">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                    disabled={!startDate}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={isDateDisabled}
                    minDate={startDate ? startDate : undefined}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Days calculation and remaining */}
          <div className="rounded-md border p-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Working Days Requested */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Working Days Requested:</p>
                <p className="text-2xl font-bold">{daysCount}</p>
              </div>
              
              {/* Days Remaining */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Days Remaining:</p>
                <p className={`text-2xl font-bold ${
                  requestType !== 'Unpaid' && requestType !== 'Other' && daysCount > daysRemaining 
                    ? 'text-red-500' 
                    : 'text-green-600'
                }`}>
                  {requestType !== 'Unpaid' && requestType !== 'Other' ? daysRemaining : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional information about your request"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !startDate || !endDate || 
              ((requestType === 'PTO' || requestType === 'Sick') && daysCount > daysRemaining)}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}