// src/app/api/clock/out/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Define interface for the time record
interface TimeRecord {
  id: string;
  employeeId: string;
  clockInTime: string;
  clockOutTime: string | null;
}

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json();
    
    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    // Check if employee is clocked in - add type assertion
    const activeRecord = db.prepare(
      'SELECT * FROM time_records WHERE employeeId = ? AND clockOutTime IS NULL'
    ).get(employeeId) as TimeRecord | undefined;
    
    if (!activeRecord) {
      return NextResponse.json(
        { success: false, message: 'Not currently clocked in' },
        { status: 400 }
      );
    }
    
    // Clock out
    const now = new Date().toISOString();
    
    db.prepare(
      'UPDATE time_records SET clockOutTime = ? WHERE id = ?'
    ).run(now, activeRecord.id);
    
    // Create a new record with the updated clockOutTime
    const updatedRecord: TimeRecord = {
      ...activeRecord,
      clockOutTime: now
    };
    
    return NextResponse.json({ 
      success: true, 
      message: 'Clocked out successfully!',
      record: updatedRecord
    });
  } catch (error) {
    console.error('Clock out error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clock out' },
      { status: 500 }
    );
  }
}