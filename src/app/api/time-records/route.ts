// src/app/api/time-records/route.ts
import { NextRequest, NextResponse } from 'next/server';
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

// Handle PUT request to update a time record
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, clockInTime, clockOutTime } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Time record ID is required' },
        { status: 400 }
      );
    }
    
    // Check if record exists
    const existingRecord = db.prepare('SELECT * FROM time_records WHERE id = ?').get(id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Time record not found' },
        { status: 404 }
      );
    }
    
    // Update the time record
    const updateQuery = clockOutTime 
      ? 'UPDATE time_records SET clockInTime = ?, clockOutTime = ? WHERE id = ?'
      : 'UPDATE time_records SET clockInTime = ?, clockOutTime = NULL WHERE id = ?';
    
    const params = clockOutTime 
      ? [clockInTime, clockOutTime, id]
      : [clockInTime, id];
    
    db.prepare(updateQuery).run(...params);
    
    // Get the updated record
    const updatedRecord = db.prepare(`
      SELECT 
        t.id, 
        t.employeeId, 
        t.clockInTime, 
        t.clockOutTime,
        e.name as employeeName
      FROM time_records t
      JOIN employees e ON t.employeeId = e.id
      WHERE t.id = ?
    `).get(id);
    
    return NextResponse.json(updatedRecord);
  } catch (error) {
    console.error('Error updating time record:', error);
    return NextResponse.json(
      { error: 'Failed to update time record' },
      { status: 500 }
    );
  }
}

// Handle DELETE request to remove a time record
export async function DELETE(request: NextRequest) {
  try {
    // Extract ID from URL parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Time record ID is required' },
        { status: 400 }
      );
    }
    
    // Check if record exists
    const existingRecord = db.prepare('SELECT * FROM time_records WHERE id = ?').get(id);
    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Time record not found' },
        { status: 404 }
      );
    }
    
    // Delete the time record
    db.prepare('DELETE FROM time_records WHERE id = ?').run(id);
    
    return NextResponse.json({ success: true, message: 'Time record deleted successfully' });
  } catch (error) {
    console.error('Error deleting time record:', error);
    return NextResponse.json(
      { error: 'Failed to delete time record' },
      { status: 500 }
    );
  }
}