import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { config } from '@/lib/config';
import { format, setHours, setMinutes, setSeconds, setMilliseconds, isAfter, parseISO } from 'date-fns';

// Define types for our time records
interface TimeRecord {
  id: string;
  employeeId: string;
  clockInTime: string;
  clockOutTime: string | null;
  autoClockOut?: number;
}

/**
 * Processes automatic clock-outs for employees who are still clocked in
 * This route is meant to be called by a scheduled task or cron job at midnight
 */
export async function POST(request: Request) {
  try {
    // Check if auto clock-out is enabled in config
    if (!config.autoClockOut.enabled) {
      return NextResponse.json({ 
        success: false, 
        message: 'Auto clock-out is disabled in configuration' 
      });
    }

    // Get request body, which might contain a custom defaultTime
    const body = await request.json().catch(() => ({}));
    
    // Use the defaultTime from request if provided, otherwise use from config
    const defaultTimeString = body.defaultTime || config.autoClockOut.defaultTime;
    
    // Parse the default time (format: HH:MM)
    const [defaultHours, defaultMinutes] = defaultTimeString.split(':').map(Number);
    
    // Get all time records that have clock-in but no clock-out
    const activeRecords = db.prepare(`
      SELECT * FROM time_records 
      WHERE clockInTime IS NOT NULL 
      AND clockOutTime IS NULL
    `).all() as TimeRecord[];

    if (!activeRecords.length) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active clock-ins found',
        clockedOut: 0
      });
    }

    const now = new Date();
    
    // Create a date object for the default clock-out time (today's date with configured time)
    const defaultClockOutTime = setMilliseconds(
      setSeconds(
        setMinutes(
          setHours(new Date(now), defaultHours),
          defaultMinutes
        ),
        0
      ),
      0
    );
    
    // Determine which time to use for clock-out
    // If current time is after default time (5:30 PM), use default time
    // Otherwise, use current time
    const clockOutTime = isAfter(now, defaultClockOutTime) ? defaultClockOutTime : now;
    
    // The clock-out time in ISO format
    const clockOutTimeIso = clockOutTime.toISOString();
    
    // Update each record that needs auto clock-out
    const updateStmt = db.prepare(`
      UPDATE time_records 
      SET clockOutTime = ?, 
          autoClockOut = 1 
      WHERE id = ?
    `);

    // Transaction to update all records
    const clockOutMultiple = db.transaction((records: TimeRecord[]) => {
      for (const record of records) {
        // Also check if the clock-in time is before the clock-out time
        // In case the employee clocked in after the default time
        const clockInTime = parseISO(record.clockInTime);
        
        // If clock-in is after our clock-out time, use the clock-in time + 1 minute
        const finalClockOutTime = isAfter(clockInTime, clockOutTime)
          ? new Date(clockInTime.getTime() + 60000).toISOString()  // Add 1 minute to clock-in time
          : clockOutTimeIso;
          
        updateStmt.run(finalClockOutTime, record.id);
      }
      return records.length;
    });

    // Execute the transaction
    const updatedCount = clockOutMultiple(activeRecords);

    // Log the event if enabled
    if (config.autoClockOut.logEvents) {
      const logStmt = db.prepare(`
        INSERT INTO system_logs (event, details, timestamp)
        VALUES (?, ?, ?)
      `);
      
      // Check if system_logs table exists first
      try {
        logStmt.run(
          'AUTO_CLOCK_OUT',
          JSON.stringify({
            recordCount: updatedCount,
            defaultTime: defaultTimeString,
            actualTime: isAfter(now, defaultClockOutTime) ? defaultTimeString : format(now, 'HH:mm'),
            employeeIds: activeRecords.map(r => r.employeeId)
          }),
          new Date().toISOString()
        );
      } catch (error) {
        // Table might not exist, just continue
        console.log('Could not log auto clock-out event, system_logs table may not exist');
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully auto-clocked out ${updatedCount} employees`,
      clockedOut: updatedCount,
      usingDefaultTime: isAfter(now, defaultClockOutTime),
      usedTime: isAfter(now, defaultClockOutTime) ? defaultTimeString : format(now, 'HH:mm'),
      records: activeRecords.map(record => ({
        id: record.id,
        employeeId: record.employeeId,
        clockInTime: record.clockInTime,
        clockOutTime: clockOutTimeIso
      }))
    });
  } catch (error) {
    console.error('Auto clock-out error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process auto clock-outs',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 