"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { config } from '@/lib/config'
import { initAutoClockOutScheduler, stopAutoClockOutScheduler } from '@/lib/autoClockOutScheduler'

export default function AutoClockOutSettings() {
  const [defaultTime, setDefaultTime] = useState(config.autoClockOut.defaultTime || '17:30')
  const [enabled, setEnabled] = useState(config.autoClockOut.enabled)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRunResult, setLastRunResult] = useState<{
    success: boolean;
    message: string;
    clockedOut: number;
    timestamp?: string;
    usedTime?: string;
    usingDefaultTime?: boolean;
  } | null>(null)

  // Convert time string to input format (HH:MM)
  const formatTimeForInput = (timeStr: string) => {
    return timeStr;
  }

  // Validate time format (HH:MM, 24-hour format)
  const isValidTimeFormat = (time: string) => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }

  // Save configuration to localStorage for persistence between sessions
  const saveConfig = () => {
    if (!isValidTimeFormat(defaultTime)) {
      toast.error('Invalid time format. Please use HH:MM (24-hour format)');
      return;
    }
    
    // Update global config object
    config.autoClockOut.enabled = enabled;
    config.autoClockOut.defaultTime = defaultTime;
    
    // Save to localStorage for persistence
    const updatedConfig = {
      ...config
    };
    
    try {
      localStorage.setItem('appConfig', JSON.stringify(updatedConfig));
      
      // Restart scheduler based on new settings
      if (enabled) {
        stopAutoClockOutScheduler();
        initAutoClockOutScheduler();
        toast.success('Settings saved and auto clock-out scheduler restarted');
      } else {
        stopAutoClockOutScheduler();
        toast.success('Settings saved and auto clock-out scheduler stopped');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save settings');
    }
  }

  // Load configuration from localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('appConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.autoClockOut) {
          setEnabled(parsedConfig.autoClockOut.enabled);
          setDefaultTime(parsedConfig.autoClockOut.defaultTime);
          
          // Update global config object
          config.autoClockOut = {
            ...config.autoClockOut,
            ...parsedConfig.autoClockOut
          };
        }
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  }, []);

  // Trigger auto clock-out manually
  const runAutoClockOut = async () => {
    if (!isValidTimeFormat(defaultTime)) {
      toast.error('Invalid time format. Please use HH:MM (24-hour format)');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auto-clock-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ defaultTime })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Auto clock-out completed: ${data.message}`);
        setLastRunResult({
          ...data,
          timestamp: new Date().toLocaleString(),
          usedTime: data.usedTime,
          usingDefaultTime: data.usingDefaultTime
        });
      } else {
        toast.error(`Failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during auto clock-out:', error);
      toast.error('Failed to run auto clock-out');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Auto Clock-Out Settings</CardTitle>
        <CardDescription>
          Configure automatic clock-out for employees still clocked in at midnight
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-clock-out-switch">Enable Auto Clock-Out</Label>
            <p className="text-sm text-muted-foreground">
              Automatically clock out employees at midnight
            </p>
          </div>
          <Switch
            id="auto-clock-out-switch"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="default-time">Default Clock-Out Time</Label>
          <div className="flex gap-2">
            <Input
              id="default-time"
              type="time"
              value={formatTimeForInput(defaultTime)}
              onChange={(e) => setDefaultTime(e.target.value)}
              className="w-40"
            />
            <Button onClick={saveConfig} variant="outline">
              Save Settings
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Time to set for automatic clock-outs when midnight check runs. If the current time is earlier 
            than {defaultTime}, the current time will be used instead.
          </p>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={runAutoClockOut} 
            disabled={isLoading || !enabled}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Run Auto Clock-Out Now'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This will clock out all employees who are currently clocked in
          </p>
        </div>

        {lastRunResult && (
          <div className="mt-4 p-3 border rounded-md bg-muted/50">
            <h4 className="font-medium text-sm mb-1">Last Auto Clock-Out Run</h4>
            <p className="text-xs text-muted-foreground mb-1">
              {lastRunResult.timestamp}
            </p>
            <p className={`text-sm ${lastRunResult.success ? 'text-green-600' : 'text-red-600'}`}>
              {lastRunResult.message}
            </p>
            {lastRunResult.success && (
              <>
                <p className="text-sm mt-1">
                  Employees clocked out: <span className="font-medium">{lastRunResult.clockedOut}</span>
                </p>
                {lastRunResult.usedTime && (
                  <p className="text-sm mt-1">
                    Time used: <span className="font-medium">{lastRunResult.usedTime}</span>
                    {lastRunResult.usingDefaultTime 
                      ? " (default time - current time was later)" 
                      : " (current time - was earlier than default)"}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 