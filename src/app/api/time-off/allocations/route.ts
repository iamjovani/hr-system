import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { TimeOffAllocation } from '@/app/types';

// GET: Fetch time-off allocations
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    const year = url.searchParams.get('year') ? parseInt(url.searchParams.get('year')!) : new Date().getFullYear();
    
    let allocations;
    
    if (employeeId) {
      // Get allocations for a specific employee
      allocations = db.prepare(`
        SELECT * FROM time_off_allocations
        WHERE employeeId = ? AND year = ?
      `).all(employeeId, year);
    } else {
      // Get allocations for all employees for a specific year
      allocations = db.prepare(`
        SELECT a.*, e.name as employeeName 
        FROM time_off_allocations a
        JOIN employees e ON a.employeeId = e.id
        WHERE a.year = ?
      `).all(year);
    }

    return NextResponse.json(allocations);
  } catch (error) {
    console.error('Error fetching time-off allocations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-off allocations' },
      { status: 500 }
    );
  }
}

// POST: Create or update a time-off allocation
export async function POST(request: Request) {
  try {
    const { employeeId, year, ptoTotal, sickDaysTotal } = await request.json();
    
    // Validate required fields
    if (!employeeId || !year) {
      return NextResponse.json(
        { error: 'Employee ID and year are required' },
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
    
    // Check if allocation exists for this employee and year
    const existingAllocation = db.prepare(`
      SELECT * FROM time_off_allocations
      WHERE employeeId = ? AND year = ?
    `).get(employeeId, year) as TimeOffAllocation | undefined;

    let allocation;
    
    if (existingAllocation) {
      // Calculate the difference between new and old total values
      const ptoDifference = (ptoTotal || existingAllocation.ptoTotal) - existingAllocation.ptoTotal;
      const sickDaysDifference = (sickDaysTotal || existingAllocation.sickDaysTotal) - existingAllocation.sickDaysTotal;
      
      // Update allocation with new values and adjust remaining values
      db.prepare(`
        UPDATE time_off_allocations 
        SET 
          ptoTotal = ?,
          ptoRemaining = ptoRemaining + ?,
          sickDaysTotal = ?,
          sickDaysRemaining = sickDaysRemaining + ? 
        WHERE id = ?
      `).run(
        ptoTotal || existingAllocation.ptoTotal,
        ptoDifference,
        sickDaysTotal || existingAllocation.sickDaysTotal,
        sickDaysDifference,
        existingAllocation.id
      );

      // Get the updated allocation
      allocation = db.prepare(`
        SELECT * FROM time_off_allocations WHERE id = ?
      `).get(existingAllocation.id);
    } else {
      // Create new allocation with default values
      const result = db.prepare(`
        INSERT INTO time_off_allocations 
        (employeeId, year, ptoTotal, ptoRemaining, sickDaysTotal, sickDaysRemaining)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        employeeId,
        year,
        ptoTotal || 80,  // Default: 10 days (80 hours)
        ptoTotal || 80,
        sickDaysTotal || 40,  // Default: 5 days (40 hours)
        sickDaysTotal || 40
      );

      // Get the newly created allocation
      allocation = db.prepare(`
        SELECT * FROM time_off_allocations WHERE id = ?
      `).get(result.lastInsertRowid);
    }

    return NextResponse.json(allocation);
  } catch (error) {
    console.error('Error creating/updating time-off allocation:', error);
    return NextResponse.json(
      { error: 'Failed to create/update time-off allocation' },
      { status: 500 }
    );
  }
}