import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { employeeId, newPassword } = await request.json();
    
    if (!employeeId || !newPassword) {
      return NextResponse.json(
        { error: 'Employee ID and new password are required' },
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const employee = db.prepare(
      'SELECT * FROM employees WHERE id = ?'
    ).get(employeeId);
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Update password
    db.prepare(
      'UPDATE employees SET password = ? WHERE id = ?'
    ).run(newPassword, employeeId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Password reset successfully' 
    });
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
} 