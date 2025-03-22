import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { employeeId, currentPassword, newPassword } = await request.json();
    
    if (!employeeId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Verify current password
    const employee = db.prepare(
      'SELECT * FROM employees WHERE id = ? AND password = ?'
    ).get(employeeId, currentPassword);
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Update password
    db.prepare(
      'UPDATE employees SET password = ? WHERE id = ?'
    ).run(newPassword, employeeId);
    
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