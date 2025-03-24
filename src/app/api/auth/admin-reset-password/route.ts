import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { employeeId, newPassword } = await request.json();

    // Validate input
    if (!employeeId || !newPassword) {
      return NextResponse.json(
        { error: 'Employee ID and new password are required' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(newPassword, 10);

    try {
      // Update the password in the database using better-sqlite3
      db.prepare(
        'UPDATE employees SET password = ? WHERE id = ?'
      ).run(hashedPassword, employeeId);

      return NextResponse.json({ message: 'Password reset successfully' });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting the password' },
      { status: 500 }
    );
  }
} 