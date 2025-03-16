// src/app/api/clock/in/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json();
    
    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: 'Employee ID is required' },
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Check if already clocked in
    const activeRecord = db.prepare(
      'SELECT * FROM time_records WHERE employeeId = ? AND clockOutTime IS NULL'
    ).get(employeeId);
    
    if (activeRecord) {
      return NextResponse.json(
        { success: false, message: 'Already clocked in!' },
        { status: 400 }
      );
    }
    
    // Create new record
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(
      'INSERT INTO time_records (id, employeeId, clockInTime) VALUES (?, ?, ?)'
    ).run(id, employeeId, now);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Clocked in successfully!',
      record: {
        id,
        employeeId,
        clockInTime: now,
        clockOutTime: null
      }
    });
  } catch (error) {
    console.error('Clock in error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to clock in' },
      { status: 500 }
    );
  }
}