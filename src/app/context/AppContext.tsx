"use client"

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  Employee, 
  TimeRecord, 
  User, 
  StatRecord, 
  ClockResult, 
  TimeOffAllocation, 
  TimeOffRequest,
  TimeOffStatus,
  TimeOffRequestType
} from '../types';
import { isWeekend, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';

interface AppContextType {
  employees: Employee[];
  timeRecords: TimeRecord[];
  timeOffAllocations: TimeOffAllocation[];
  timeOffRequests: TimeOffRequest[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  clockIn: (employeeId: string) => Promise<ClockResult>;
  clockOut: (employeeId: string) => Promise<ClockResult>;
  addEmployee: (employee: Partial<Employee>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  updateTimeRecord: (id: string, updates: Partial<TimeRecord>) => Promise<void>;
  deleteTimeRecord: (id: string) => Promise<void>;
  calculateStats: (employeeId?: string) => StatRecord[];
  isLoaded: boolean;
  fetchTimeRecords: (employeeId: number | string) => Promise<void>;
  resetPassword: (employeeId: string, currentPassword: string, newPassword: string) => Promise<void>;
  adminResetPassword: (employeeId: string, newPassword: string) => Promise<void>;
  
  // Time-off management functions
  fetchTimeOffAllocations: (employeeId?: string, year?: number) => Promise<void>;
  updateTimeOffAllocation: (employeeId: string, year: number, ptoTotal: number, sickDaysTotal: number) => Promise<void>;
  fetchTimeOffRequests: (employeeId?: string, status?: TimeOffStatus) => Promise<void>;
  createTimeOffRequest: (request: Partial<TimeOffRequest>) => Promise<TimeOffRequest>;
  updateTimeOffRequestStatus: (requestId: number, status: TimeOffStatus) => Promise<void>;
  deleteTimeOffRequest: (requestId: number) => Promise<void>;
  calculateDaysInDateRange: (startDate: Date, endDate: Date) => number;
  wouldExceedQuota: (employeeId: string, requestType: TimeOffRequestType, startDate: Date, endDate: Date) => {
    exceedsQuota: boolean;
    remainingDays: number;
    requestedDays: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [timeOffAllocations, setTimeOffAllocations] = useState<TimeOffAllocation[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Load data from API on initial mount - only once
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) return;
    
    const fetchData = async () => {
      try {
        // Fetch employees
        const employeesResponse = await fetch('/api/employees');

        if (!employeesResponse.ok) {
          console.error('Failed to fetch employees:', employeesResponse.status);
          setIsLoaded(true);
          setIsInitialized(true);
          return;
        }
        const employeesData = await employeesResponse.json();
        setEmployees(employeesData);

        // Fetch time records
        const timeRecordsResponse = await fetch('/api/time-records');
        if (!timeRecordsResponse.ok) {
          console.error('Failed to fetch time records:', timeRecordsResponse.status);
          setIsLoaded(true);
          setIsInitialized(true);
          return;
        }
        const timeRecordsData = await timeRecordsResponse.json();
        setTimeRecords(timeRecordsData);

        // Safely restore current user from session storage
        try {
          const savedUser = sessionStorage.getItem('currentUser');
          if (savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
            const user = JSON.parse(savedUser);
            setCurrentUser(user);
            
            // If we have a current user, fetch their time-off data
            if (user && user.id) {
              try {
                // Fetch time-off allocations for the current user
                const currentYear = new Date().getFullYear();
                const allocationsResponse = await fetch(`/api/time-off/allocations?employeeId=${user.id}&year=${currentYear}`);
                if (allocationsResponse.ok) {
                  const allocationsData = await allocationsResponse.json();
                  setTimeOffAllocations(allocationsData);
                }
                
                // Fetch time-off requests for the current user
                const requestsResponse = await fetch(`/api/time-off/requests?employeeId=${user.id}`);
                if (requestsResponse.ok) {
                  const requestsData = await requestsResponse.json();
                  setTimeOffRequests(requestsData);
                }
              } catch (error) {
                console.error('Error fetching time-off data:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing user from session storage:', error);
          // If there's an error, clear the corrupted session storage
          sessionStorage.removeItem('currentUser');
        }

        setIsLoaded(true);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoaded(true);
        setIsInitialized(true);
      }
    };

    fetchData();
  }, [isInitialized]);

  // Safely save current user to session storage
  useEffect(() => {
    if (currentUser) {
      try {
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Error saving user to session storage:', error);
      }
    } else {
      sessionStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  // Clock in function
  const clockIn = async (employeeId: string): Promise<ClockResult> => {
    try {
      const response = await fetch('/api/clock/in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
      });
      
      if (!response.ok) {
        return { 
          success: false, 
          message: `Failed to clock in: ${response.status}` 
        };
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setTimeRecords(prev => [...prev, result.record]);
      }
      
      return { 
        success: result.success, 
        message: result.message 
      };
    } catch (error) {
      console.error('Clock in error:', error);
      return { 
        success: false, 
        message: 'Failed to clock in. Please try again.' 
      };
    }
  };
  
  // Clock out function
  const clockOut = async (employeeId: string): Promise<ClockResult> => {
    try {
      const response = await fetch('/api/clock/out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId }),
      });
      
      if (!response.ok) {
        return { 
          success: false, 
          message: `Failed to clock out: ${response.status}` 
        };
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state
        setTimeRecords(prev => 
          prev.map(record => 
            record.id === result.record.id ? result.record : record
          )
        );
      }
      
      return { 
        success: result.success, 
        message: result.message 
      };
    } catch (error) {
      console.error('Clock out error:', error);
      return { 
        success: false, 
        message: 'Failed to clock out. Please try again.' 
      };
    }
  };
  
  // Add employee function
  const addEmployee = async (employee: Partial<Employee>): Promise<Employee> => {
    try {
      if (!employee.name || employee.payRate === undefined) {
        throw new Error('Employee must have a name and pay rate');
      }
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: employee.name,
          payRate: employee.payRate,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add employee: ${response.status}`);
      }
      
      const newEmployee = await response.json();
      
      // Update local state
      setEmployees(prev => [...prev, newEmployee]);
      
      return newEmployee;
    } catch (error) {
      console.error('Add employee error:', error);
      throw error;
    }
  };
  
  // Update employee function
  const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<void> => {
    try {
      // Ensure id and updates are valid
      if (!id) {
        throw new Error('Employee ID is required');
      }

      // Type safety check for updates
      if (typeof updates !== 'object' || updates === null) {
        throw new Error('Invalid updates object');
      }

      // Make the API call
      const response = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      // Handle non-OK responses
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update employee';
        
        try {
          // Safely parse the error response without assuming structure
          const errorObj = JSON.parse(errorText);
          // Use type guards to safely access properties
          if (typeof errorObj === 'object' && errorObj !== null) {
            if ('error' in errorObj && typeof errorObj.error === 'string') {
              errorMessage = errorObj.error;
            }
          }
        } catch (parseError) {
          // If JSON parsing fails, use the text if it exists
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      const responseData = await response.json();
      
      // Type guard to ensure the response matches Employee type
      const isValidEmployee = (data: any): data is Employee => {
        return (
          typeof data === 'object' &&
          data !== null &&
          'id' in data &&
          'name' in data &&
          'payRate' in data
        );
      };
      
      if (!isValidEmployee(responseData)) {
        throw new Error('Invalid employee data returned from server');
      }
      
      // Now TypeScript knows responseData is an Employee
      const updatedEmployee: Employee = responseData;
      
      // Update local state with the properly typed employee
      setEmployees(prev => 
        prev.map(emp => 
          emp.id === id ? updatedEmployee : emp
        )
      );
    } catch (error) {
      console.error('Update employee error:', error);
      throw error; // Re-throw the error so it can be caught by the component
    }
  };
  
  // Delete employee function
  const deleteEmployee = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete employee: ${response.status}`);
      }
      
      // Update local state
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    } catch (error) {
      console.error('Delete employee error:', error);
      throw error;
    }
  };

  // Update time record function
  const updateTimeRecord = async (id: string, updates: Partial<TimeRecord>): Promise<void> => {
    try {
      // Ensure id and updates are valid
      if (!id) {
        throw new Error('Time record ID is required');
      }

      // Type safety check for updates
      if (typeof updates !== 'object' || updates === null) {
        throw new Error('Invalid updates object');
      }

      const response = await fetch('/api/time-records', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...updates
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update time record';
        
        try {
          // Safely parse the error response without assuming structure
          const errorObj = JSON.parse(errorText);
          if (typeof errorObj === 'object' && errorObj !== null) {
            if ('error' in errorObj && typeof errorObj.error === 'string') {
              errorMessage = errorObj.error;
            }
          }
        } catch (parseError) {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      const updatedRecord = await response.json();
      
      // Update local state
      setTimeRecords(prevRecords => 
        prevRecords.map(record => 
          record.id === id ? updatedRecord : record
        )
      );
    } catch (error) {
      console.error('Update time record error:', error);
      throw error;
    }
  };

  // Delete time record function
  const deleteTimeRecord = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/time-records?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete time record';
        
        try {
          const errorObj = JSON.parse(errorText);
          if (typeof errorObj === 'object' && errorObj !== null) {
            if ('error' in errorObj && typeof errorObj.error === 'string') {
              errorMessage = errorObj.error;
            }
          }
        } catch (parseError) {
          if (errorText) {
            errorMessage = errorText;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Update local state by removing the deleted record
      setTimeRecords(prevRecords => 
        prevRecords.filter(record => record.id !== id)
      );
    } catch (error) {
      console.error('Delete time record error:', error);
      throw error;
    }
  };
  
  // Calculate total hours and pay
  const calculateStats = (employeeId?: string): StatRecord[] => {
    const filteredRecords = employeeId 
      ? timeRecords.filter(record => record.employeeId === employeeId && record.clockOutTime)
      : timeRecords.filter(record => record.clockOutTime);
      
    return filteredRecords.map(record => {
      const employee = employees.find(emp => emp.id === record.employeeId);
      if (!employee || !record.clockOutTime) return null;
      
      const clockIn = new Date(record.clockInTime);
      const clockOut = new Date(record.clockOutTime);
      const hoursWorked = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
      const pay = hoursWorked * employee.payRate;
      
      return {
        ...record,
        employeeName: employee.name,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        pay: parseFloat(pay.toFixed(2))
      };
    }).filter((record): record is StatRecord => record !== null);
  };

  const fetchTimeRecords = async (employeeId: number | string): Promise<void> => {
    try {
      // Don't do string concatenation for URLs - use URLSearchParams
      const url = new URL('/api/time-records', window.location.origin);
      url.searchParams.append('employeeId', employeeId.toString());
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch time records: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update time records state
      setTimeRecords(prev => {
        // Keep records for other employees, replace records for this employee
        const filteredRecords = prev.filter(record => 
          record.employeeId !== employeeId.toString()
        );
        return [...filteredRecords, ...data];
      });
    } catch (error) {
      console.error('Error fetching time records:', error);
      throw error;
    }
  };

  const resetPassword = async (
    employeeId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId,
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const adminResetPassword = async (
    employeeId: string,
    newPassword: string
  ): Promise<void> => {
    try {
      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId,
          newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Admin reset password error:', error);
      throw error;
    }
  };

  // Time-off management functions
  const fetchTimeOffAllocations = async (employeeId?: string, year?: number): Promise<void> => {
    try {
      const url = new URL('/api/time-off/allocations', window.location.origin);
      
      if (employeeId) {
        url.searchParams.append('employeeId', employeeId.toString());
      }
      
      if (year) {
        url.searchParams.append('year', year.toString());
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch time-off allocations: ${response.status}`);
      }
      
      const data = await response.json();
      
      setTimeOffAllocations(data);
    } catch (error) {
      console.error('Error fetching time-off allocations:', error);
      throw error;
    }
  };

  const updateTimeOffAllocation = async (
    employeeId: string, 
    year: number, 
    ptoTotal: number, 
    sickDaysTotal: number
  ): Promise<void> => {
    try {
      const response = await fetch('/api/time-off/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          year,
          ptoTotal,
          sickDaysTotal
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update time-off allocation');
      }
      
      const result = await response.json();
      
      // Update local state
      setTimeOffAllocations(prev => {
        const index = prev.findIndex(
          a => a.employeeId === employeeId && a.year === year
        );
        
        if (index >= 0) {
          // Replace existing allocation
          const updated = [...prev];
          updated[index] = result.allocation;
          return updated;
        } else {
          // Add new allocation
          return [...prev, result.allocation];
        }
      });
    } catch (error) {
      console.error('Error updating time-off allocation:', error);
      throw error;
    }
  };

  const fetchTimeOffRequests = async (employeeId?: string, status?: TimeOffStatus): Promise<void> => {
    try {
      const url = new URL('/api/time-off/requests', window.location.origin);
      
      if (employeeId) {
        url.searchParams.append('employeeId', employeeId.toString());
      }
      
      if (status) {
        url.searchParams.append('status', status);
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Failed to fetch time-off requests: ${response.status}`);
      }
      
      const data = await response.json();
      
      setTimeOffRequests(data);
    } catch (error) {
      console.error('Error fetching time-off requests:', error);
      throw error;
    }
  };

  const createTimeOffRequest = async (request: Partial<TimeOffRequest>): Promise<TimeOffRequest> => {
    try {
      const response = await fetch('/api/time-off/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create time-off request');
      }
      
      const result = await response.json();
      
      // Update local state
      setTimeOffRequests(prev => [...prev, result.request]);
      
      return result.request;
    } catch (error) {
      console.error('Error creating time-off request:', error);
      throw error;
    }
  };

  const updateTimeOffRequestStatus = async (requestId: number, status: TimeOffStatus): Promise<void> => {
    try {
      const response = await fetch(`/api/time-off/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update request status');
      }
      
      const result = await response.json();
      
      // Update local state
      setTimeOffRequests(prev => 
        prev.map(req => req.id === requestId ? result.request : req)
      );
      
      // If an allocation was updated (e.g., PTO or sick days deducted), refresh allocations
      if (
        result.request && 
        status === 'approved' && 
        (result.request.requestType === 'PTO' || result.request.requestType === 'Sick')
      ) {
        const employeeId = result.request.employeeId;
        const year = new Date(result.request.startDate).getFullYear();
        await fetchTimeOffAllocations(employeeId, year);
      }
    } catch (error) {
      console.error('Error updating time-off request status:', error);
      throw error;
    }
  };

  const deleteTimeOffRequest = async (requestId: number): Promise<void> => {
    try {
      const response = await fetch(`/api/time-off/requests/${requestId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete time-off request');
      }
      
      // Update local state by removing the deleted request
      setTimeOffRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error deleting time-off request:', error);
      throw error;
    }
  };

  const calculateDaysInDateRange = (startDate: Date, endDate: Date): number => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.filter(day => !isWeekend(day)).length;
  };

  const wouldExceedQuota = (
    employeeId: string, 
    requestType: TimeOffRequestType, 
    startDate: Date, 
    endDate: Date
  ) => {
    const allocation = timeOffAllocations.find(a => a.employeeId === employeeId);
    if (!allocation) {
      return { exceedsQuota: true, remainingDays: 0, requestedDays: 0 };
    }

    const requestedDays = calculateDaysInDateRange(startDate, endDate);
    let remainingDays = 0;

    if (requestType === 'PTO') {
      remainingDays = allocation.ptoRemaining;
    } else if (requestType === 'Sick') {
      remainingDays = allocation.sickDaysRemaining;
    }

    const exceedsQuota = requestedDays > remainingDays;

    return { exceedsQuota, remainingDays, requestedDays };
  };

  const value: AppContextType = {
    employees,
    timeRecords,
    timeOffAllocations,
    timeOffRequests,
    currentUser,
    setCurrentUser,
    clockIn,
    clockOut,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    updateTimeRecord,
    deleteTimeRecord,
    calculateStats,
    isLoaded,
    fetchTimeRecords,
    resetPassword,
    adminResetPassword,
    fetchTimeOffAllocations,
    updateTimeOffAllocation,
    fetchTimeOffRequests,
    createTimeOffRequest,
    updateTimeOffRequestStatus,
    deleteTimeOffRequest,
    calculateDaysInDateRange,
    wouldExceedQuota
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;