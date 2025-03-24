import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { compare } from 'bcryptjs';

// Define interface for the employee
interface Employee {
  id: string;
  name: string;
  payRate: number;
  password: string;
  [key: string]: any;
}

export async function POST(request: Request) {
  try {
    const { employeeId, password } = await request.json();
    
    if (!employeeId || !password) {
      return NextResponse.json(
        { error: 'Employee ID and password are required' },
        { status: 400 }
      );
    }
    
    // First get the employee by ID only
    const employee = db.prepare(
      'SELECT * FROM employees WHERE id = ?'
    ).get(employeeId) as Employee | undefined;
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Compare the provided password with the stored hash
    const isValidPassword = await compare(password, employee.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Remove password from response
    const { password: _, ...employeeWithoutPassword } = employee;
    
    return NextResponse.json(employeeWithoutPassword);
  } catch (error) {
    console.error('Employee login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
} 