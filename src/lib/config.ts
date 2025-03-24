/**
 * Application configuration settings
 */

export const config = {
  /**
   * Auto clock-out configuration
   */
  autoClockOut: {
    /**
     * Whether auto clock-out is enabled
     */
    enabled: true,
    
    /**
     * Default time to set for auto clock-out in 24-hour format: HH:MM
     */
    defaultTime: '17:30', // 5:30 PM
    
    /**
     * Whether to log auto clock-out events
     */
    logEvents: true
  }
}; 