import { NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * Initialize time-off tables in the database
 * This endpoint should be called once during setup to create the necessary tables
 * for time-off management.
 */
export async function POST() {
  try {
    // Create time_off_allocations table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS time_off_allocations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId TEXT NOT NULL,
        year INTEGER NOT NULL,
        ptoTotal REAL NOT NULL DEFAULT 80,
        ptoRemaining REAL NOT NULL DEFAULT 80,
        sickDaysTotal REAL NOT NULL DEFAULT 40,
        sickDaysRemaining REAL NOT NULL DEFAULT 40,
        FOREIGN KEY (employeeId) REFERENCES employees(id),
        UNIQUE(employeeId, year)
      )
    `).run();
    
    // Create time_off_requests table if it doesn't exist
    db.prepare(`
      CREATE TABLE IF NOT EXISTS time_off_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId TEXT NOT NULL,
        requestType TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT NOT NULL,
        durationDays REAL NOT NULL,
        notes TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT,
        FOREIGN KEY (employeeId) REFERENCES employees(id)
      )
    `).run();
    
    return NextResponse.json({
      success: true,
      message: 'Time-off tables initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing time-off tables:', error);
    return NextResponse.json(
      { error: 'Failed to initialize time-off tables' },
      { status: 500 }
    );
  }
}