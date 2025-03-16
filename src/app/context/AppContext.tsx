// src/app/context/AppContext.tsx (fixed JSON parsing errors)
"use client"

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Employee, TimeRecord, User, StatRecord, ClockResult } from '../types';

interface AppContextType {
  employees: Employee[];
  timeRecords: TimeRecord[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  clockIn: (employeeId: string) => Promise<ClockResult>;
  clockOut: (employeeId: string) => Promise<ClockResult>;
  addEmployee: (employee: Partial<Employee>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  calculateStats: (employeeId?: string) => StatRecord[];
  isLoaded: boolean;
  fetchTimeRecords: (employeeId: number | string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
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
            setCurrentUser(JSON.parse(savedUser));
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

  const value: AppContextType = {
    employees,
    timeRecords,
    currentUser,
    setCurrentUser,
    clockIn,
    clockOut,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    calculateStats,
    isLoaded,
    fetchTimeRecords
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