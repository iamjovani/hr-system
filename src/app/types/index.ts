// Define types for our application
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  pin?: string;
  dateCreated: string;
  lastLogin?: string;
}

export interface TimeRecord {
  id: string | number;
  employeeId: string;
  clockInTime: string;
  clockOutTime: string | null;
  employeeName?: string;
  autoClockOut?: number;
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

export type TimeOffRequestType = 'PTO' | 'Sick' | 'Unpaid' | 'Other';
export type TimeOffStatus = 'pending' | 'approved' | 'denied';

export interface TimeOffAllocation {
  id: number;
  employeeId: string;
  year: number;
  ptoTotal: number;
  ptoRemaining: number;
  sickDaysTotal: number;
  sickDaysRemaining: number;
  employeeName?: string;
}

export interface TimeOffRequest {
  id: number;
  employeeId: string;
  requestType: TimeOffRequestType;
  startDate: string;
  endDate: string;
  durationDays: number;
  notes?: string;
  status: TimeOffStatus;
  createdAt: string;
  updatedAt?: string;
  employeeName?: string;
}