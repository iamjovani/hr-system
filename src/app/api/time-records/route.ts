// src/app/api/time-records/route.ts
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Query time records with employee information
    const timeRecords = db.prepare(`
      SELECT 
        t.id, 
        t.employeeId, 
        t.clockInTime, 
        t.clockOutTime,
        e.name as employeeName
      FROM time_records t
      JOIN employees e ON t.employeeId = e.id
    `).all();
    
    return NextResponse.json(timeRecords);
  } catch (error) {
    console.error('Error fetching time records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time records' },
      { status: 500 }
    );
  }
}