/**
 * Auto Clock-Out Scheduler
 * 
 * This module schedules a job to run at midnight to automatically clock out
 * any employees who are still clocked in.
 */

import { config } from './config';

let scheduledJob: NodeJS.Timeout | null = null;

/**
 * Calculate milliseconds until the next scheduled time (midnight)
 */
function calculateMillisecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight
  return midnight.getTime() - now.getTime();
}

/**
 * Execute the auto clock-out operation by calling the API endpoint
 */
async function executeAutoClockOut(): Promise<void> {
  try {
    console.log('Running scheduled auto clock-out at:', new Date().toISOString());
    
    // Determine the API URL based on whether we're in a browser or Node.js environment
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/auto-clock-out`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`Auto clock-out completed: ${result.message}`);
    } else {
      console.error(`Auto clock-out failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error executing auto clock-out:', error);
  }
  
  // Schedule the next run
  scheduleNextRun();
}

/**
 * Schedule the next auto clock-out run at midnight
 */
function scheduleNextRun(): void {
  if (!config.autoClockOut.enabled) {
    console.log('Auto clock-out is disabled. Not scheduling next run.');
    return;
  }
  
  // Clear any existing scheduled job
  if (scheduledJob) {
    clearTimeout(scheduledJob);
  }
  
  // Calculate time until next midnight
  const msUntilMidnight = calculateMillisecondsUntilMidnight();
  
  // Schedule the job
  scheduledJob = setTimeout(() => {
    executeAutoClockOut();
  }, msUntilMidnight);
  
  console.log(`Auto clock-out scheduled for midnight (${msUntilMidnight}ms from now)`);
}

/**
 * Initialize the auto clock-out scheduler
 */
export function initAutoClockOutScheduler(): void {
  // Only run if auto clock-out is enabled
  if (!config.autoClockOut.enabled) {
    console.log('Auto clock-out is disabled. Scheduler not started.');
    return;
  }
  
  console.log('Initializing auto clock-out scheduler');
  scheduleNextRun();
}

/**
 * Stop the auto clock-out scheduler
 */
export function stopAutoClockOutScheduler(): void {
  if (scheduledJob) {
    clearTimeout(scheduledJob);
    scheduledJob = null;
    console.log('Auto clock-out scheduler stopped');
  }
} 