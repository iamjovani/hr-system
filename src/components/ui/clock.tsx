"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ClockProps {
  className?: string
}

export function Clock({ className }: ClockProps) {
  const [time, setTime] = React.useState(new Date())
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className={cn("flex flex-col items-end", className)}>
      <span className="text-2xl font-semibold">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
      <span className="text-xs text-muted-foreground">
        {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
      </span>
    </div>
  )
}