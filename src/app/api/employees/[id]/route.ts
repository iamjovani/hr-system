// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Define interfaces for type safety
interface Employee {
  id: string;
  name: string;
  payRate: number;
}

interface EmployeeUpdate {
  name?: string;
  payRate?: number;
}

// Use Next.js types for route parameters
type RouteParams = { params: { id: string } };

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = context.params;
    
    // Add type assertion to tell TypeScript about the object structure
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?')
      .get(id) as Employee | undefined;
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = context.params;
    
    // Parse the request body
    const updates: EmployeeUpdate = await request.json();
    
    // Validate employee exists - add type assertion here
    const existingEmployee = db.prepare('SELECT * FROM employees WHERE id = ?')
      .get(id) as Employee | undefined;
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Handle updates, preserving existing values if not provided
    const updatedName = updates.name !== undefined ? updates.name : existingEmployee.name;
    const updatedPayRate = updates.payRate !== undefined ? updates.payRate : existingEmployee.payRate;
    
    // Update the employee record
    db.prepare('UPDATE employees SET name = ?, payRate = ? WHERE id = ?').run(
      updatedName, 
      updatedPayRate, 
      id
    );
    
    // Fetch and return the updated employee - add type assertion here too
    const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?')
      .get(id) as Employee;
    
    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = context.params;
    
    // Check if employee exists - add type assertion here
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?')
      .get(id) as Employee | undefined;
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Delete the employee
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
    
    // Also delete related time records
    db.prepare('DELETE FROM time_records WHERE employeeId = ?').run(id);
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}