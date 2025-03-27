import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { TimeOffStatus, TimeOffRequest, TimeOffAllocation } from '@/app/types';

// GET: Fetch a specific time-off request
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    // Get the request with employee information
    const timeOffRequest = db.prepare(`
      SELECT r.*, e.name as employeeName
      FROM time_off_requests r
      JOIN employees e ON r.employeeId = e.id
      WHERE r.id = ?
    `).get(id);
    
    if (!timeOffRequest) {
      return NextResponse.json(
        { error: 'Time-off request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(timeOffRequest);
  } catch (error) {
    console.error('Error fetching time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-off request' },
      { status: 500 }
    );
  }
}

// PUT: Update a time-off request (approve or reject)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status, notes } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    // Note: 'denied' is the correct status value in our type definition, not 'rejected'
    if (!status || !['approved', 'denied', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (approved, denied, or pending) is required' },
        { status: 400 }
      );
    }
    
    // Check if the request exists
    const existingRequest = db.prepare(`
      SELECT * FROM time_off_requests WHERE id = ?
    `).get(id) as TimeOffRequest;
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Time-off request not found' },
        { status: 404 }
      );
    }
    
    // Don't allow updating already processed requests
    if (existingRequest.status !== 'pending' && status !== existingRequest.status) {
      return NextResponse.json(
        { error: 'Cannot modify a request that has already been processed' },
        { status: 400 }
      );
    }
    
    // Begin a transaction for updating the request and adjusting PTO/sick day balance
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Update the request status and add update timestamp
      db.prepare(`
        UPDATE time_off_requests 
        SET status = ?, updatedAt = ?, notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END
        WHERE id = ?
      `).run(
        status,
        new Date().toISOString(),
        notes, // If notes is null or undefined, this will be null
        notes, 
        id
      );
      
      // If approved, deduct the days from the employee's time-off balance
      if (status === 'approved') {
        const { employeeId, requestType, durationDays } = existingRequest;
        
        // Only adjust balances for PTO or Sick leave
        if (requestType === 'PTO' || requestType === 'Sick') {
          const currentYear = new Date().getFullYear();
          
          // Get the current allocation
          const allocation = db.prepare(`
            SELECT * FROM time_off_allocations
            WHERE employeeId = ? AND year = ?
          `).get(employeeId, currentYear) as TimeOffAllocation;
          
          if (allocation) {
            // Update the remaining balance
            if (requestType === 'PTO') {
              db.prepare(`
                UPDATE time_off_allocations 
                SET ptoRemaining = ptoRemaining - ? 
                WHERE id = ?
              `).run(durationDays, allocation.id);
            } else {
              // Sick leave
              db.prepare(`
                UPDATE time_off_allocations 
                SET sickDaysRemaining = sickDaysRemaining - ? 
                WHERE id = ?
              `).run(durationDays, allocation.id);
            }
          }
        }
      }
      
      // If previously approved but now denied/pending, restore the days to the balance
      if (existingRequest.status === 'approved' && status !== 'approved') {
        const { employeeId, requestType, durationDays } = existingRequest;
        
        // Only adjust balances for PTO or Sick leave
        if (requestType === 'PTO' || requestType === 'Sick') {
          const currentYear = new Date().getFullYear();
          
          // Get the current allocation
          const allocation = db.prepare(`
            SELECT * FROM time_off_allocations
            WHERE employeeId = ? AND year = ?
          `).get(employeeId, currentYear) as TimeOffAllocation;
          
          if (allocation) {
            // Restore the balance
            if (requestType === 'PTO') {
              db.prepare(`
                UPDATE time_off_allocations 
                SET ptoRemaining = ptoRemaining + ? 
                WHERE id = ?
              `).run(durationDays, allocation.id);
            } else {
              // Sick leave
              db.prepare(`
                UPDATE time_off_allocations 
                SET sickDaysRemaining = sickDaysRemaining + ? 
                WHERE id = ?
              `).run(durationDays, allocation.id);
            }
          }
        }
      }
      
      // Commit the transaction
      db.prepare('COMMIT').run();
      
      // Get the updated request
      const updatedRequest = db.prepare(`
        SELECT r.*, e.name as employeeName
        FROM time_off_requests r
        JOIN employees e ON r.employeeId = e.id
        WHERE r.id = ?
      `).get(id);
      
      return NextResponse.json(updatedRequest);
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error updating time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to update time-off request' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a time-off request
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }
    
    // Check if the request exists
    const existingRequest = db.prepare(`
      SELECT * FROM time_off_requests WHERE id = ?
    `).get(id) as TimeOffRequest;
    
    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Time-off request not found' },
        { status: 404 }
      );
    }
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // If request was approved, restore the days to the balance
      if (existingRequest.status === 'approved') {
        const { employeeId, requestType, durationDays } = existingRequest;
        
        // Only adjust balances for PTO or Sick leave
        if (requestType === 'PTO' || requestType === 'Sick') {
          const currentYear = new Date().getFullYear();
          
          // Get the current allocation
          const allocation = db.prepare(`
            SELECT * FROM time_off_allocations
            WHERE employeeId = ? AND year = ?
          `).get(employeeId, currentYear) as TimeOffAllocation;
          
          if (allocation) {
            // Restore the balance
            if (requestType === 'PTO') {
              db.prepare(`
                UPDATE time_off_allocations 
                SET ptoRemaining = ptoRemaining + ? 
                WHERE id = ?
              `).run(durationDays, allocation.id);
            } else {
              // Sick leave
              db.prepare(`
                UPDATE time_off_allocations 
                SET sickDaysRemaining = sickDaysRemaining + ? 
                WHERE id = ?
              `).run(durationDays, allocation.id);
            }
          }
        }
      }
      
      // Delete the request
      db.prepare('DELETE FROM time_off_requests WHERE id = ?').run(id);
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      return NextResponse.json({ 
        success: true,
        message: 'Time-off request deleted successfully'
      });
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting time-off request:', error);
    return NextResponse.json(
      { error: 'Failed to delete time-off request' },
      { status: 500 }
    );
  }
}