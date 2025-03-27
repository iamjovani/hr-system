import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { TimeOffRequest, TimeOffStatus, TimeOffAllocation } from '@/app/types';
import { differenceInBusinessDays, parseISO } from 'date-fns';

// GET: Fetch all time-off requests with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as TimeOffStatus | null;
    const employeeId = searchParams.get('employeeId');
    
    let query = `
      SELECT r.*, e.name as employeeName
      FROM time_off_requests r
      JOIN employees e ON r.employeeId = e.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (status) {
      query += ` AND r.status = ?`;
      params.push(status);
    }
    
    if (employeeId) {
      query += ` AND r.employeeId = ?`;
      params.push(employeeId);
    }
    
    query += ` ORDER BY r.createdAt DESC`;
    
    const requests = db.prepare(query).all(...params);
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching time-off requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-off requests' },
      { status: 500 }
    );
  }
}

// POST: Create a new time-off request
export async function POST(request: Request) {
  try {
    const { employeeId, requestType, startDate, endDate, durationDays, notes } = await request.json();
    
    // Validate required fields
    if (!employeeId || !requestType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Employee ID, request type, start date and end date are required' },
        { status: 400 }
      );
    }
    
    // Validate date range
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }
    
    // Check if employee exists
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    // Calculate business days between dates including both start and end dates
    const workDays = durationDays || (differenceInBusinessDays(end, start) + 1);
    
    // Check if employee has enough time-off balance for this year
    if (requestType === 'PTO' || requestType === 'Sick') {
      const currentYear = new Date().getFullYear();
      
      const allocation = db.prepare(`
        SELECT * FROM time_off_allocations
        WHERE employeeId = ? AND year = ?
      `).get(employeeId, currentYear) as TimeOffAllocation | undefined;
      
      if (allocation) {
        const remainingDays = requestType === 'PTO' 
          ? allocation.ptoRemaining 
          : allocation.sickDaysRemaining;
        
        if (workDays > remainingDays) {
          return NextResponse.json(
            { 
              error: `Not enough ${requestType} days remaining`,
              requested: workDays,
              available: remainingDays 
            },
            { status: 400 }
          );
        }
      } else {
        // Create default allocation for employee if none exists
        const defaultPto = 10; // 10 days
        const defaultSickDays = 5; // 5 days
        
        db.prepare(`
          INSERT INTO time_off_allocations 
          (employeeId, year, ptoTotal, ptoRemaining, sickDaysTotal, sickDaysRemaining)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          employeeId,
          currentYear,
          defaultPto,
          defaultPto,
          defaultSickDays,
          defaultSickDays
        );
        
        // Check if request exceeds new allocation
        if ((requestType === 'PTO' && workDays > defaultPto) || 
            (requestType === 'Sick' && workDays > defaultSickDays)) {
          return NextResponse.json(
            { 
              error: `Not enough ${requestType} days remaining`,
              requested: workDays,
              available: requestType === 'PTO' ? defaultPto : defaultSickDays 
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Create time-off request with pending status
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO time_off_requests 
      (employeeId, requestType, startDate, endDate, durationDays, notes, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      employeeId,
      requestType,
      startDate,
      endDate,
      workDays,
      notes || '',
      'pending',
      now
    );
    
    // Get the newly created request
    const newRequest = db.prepare(`
      SELECT * FROM time_off_requests WHERE id = ?
    `).get(result.lastInsertRowid);
    
    return NextResponse.json({ request: newRequest });
  } catch (error) {
    console.error('Error creating time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to create time-off request' },
      { status: 500 }
    );
  }
}