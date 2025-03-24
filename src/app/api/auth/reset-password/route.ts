import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { compare, hash } from 'bcryptjs';

interface Employee {
  id: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const { employeeId, currentPassword, newPassword } = await request.json();
    
    if (!employeeId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // First get the employee by ID only
    const employee = db.prepare(
      'SELECT * FROM employees WHERE id = ?'
    ).get(employeeId) as Employee | undefined;
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Verify current password using bcrypt
    const isValidPassword = await compare(currentPassword, employee.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);
    
    // Update password with hashed version
    db.prepare(
      'UPDATE employees SET password = ? WHERE id = ?'
    ).run(hashedPassword, employeeId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
} 