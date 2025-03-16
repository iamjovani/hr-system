// src/app/api/employees/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// Define interface for employee type
interface Employee {
  id: string;
  name: string;
  payRate: number;
}

// GET endpoint handler
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Await params before accessing id
  const { id } = await params;

  try {
    // Fetch employee by ID
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

// PUT endpoint handler
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Await params before accessing id
  const { id } = await params;
  
  try {
    // Parse request body
    const updates = await request.json();
    
    // Verify employee exists
    const existingEmployee = db.prepare('SELECT * FROM employees WHERE id = ?')
      .get(id) as Employee | undefined;
    
    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Update employee record
    const updatedName = updates.name !== undefined ? updates.name : existingEmployee.name;
    const updatedPayRate = updates.payRate !== undefined ? updates.payRate : existingEmployee.payRate;
    
    db.prepare('UPDATE employees SET name = ?, payRate = ? WHERE id = ?').run(
      updatedName, 
      updatedPayRate, 
      id
    );
    
    // Return updated employee
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

// DELETE endpoint handler
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  
  try {
    // Check if employee exists
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?')
      .get(id) as Employee | undefined;
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Delete employee and related records
    db.prepare('DELETE FROM employees WHERE id = ?').run(id);
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