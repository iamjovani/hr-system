// Define types for our application
export interface Employee {
    id: string;
    name: string;
    payRate: number;
  }
  
  export interface TimeRecord {
    id: string;
    employeeId: string;
    clockInTime: string;
    clockOutTime: string | null;
  }
  
  export interface User extends Employee {
    isAdmin: boolean;
  }
  
  export interface StatRecord extends TimeRecord {
    employeeName: string;
    hoursWorked: number;
    pay: number;
  }
  
  export interface ClockResult {
    success: boolean;
    message: string;
  }