"use client"

import { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminPasswordReset() {
  const { employees, adminResetPassword, currentUser } = useAppContext()
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Only admins should see this component
  if (!currentUser?.isAdmin) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployeeId) {
      toast.error("No employee selected", {
        description: "Please select an employee"
      })
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "New password and confirmation must match"
      })
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password too short", {
        description: "Password must be at least 6 characters long"
      })
      return
    }

    setIsLoading(true)
    
    try {
      await adminResetPassword(selectedEmployeeId, newPassword)
      
      toast.success("Password reset successful", {
        description: "The employee's password has been reset"
      })
      
      // Clear form
      setSelectedEmployeeId('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error(error)
      toast.error("Failed to reset password", {
        description: error instanceof Error ? error.message : "An error occurred during password reset"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Admin Password Reset</CardTitle>
        <CardDescription>
          Reset a password for an employee
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Select Employee</Label>
            <Select 
              value={selectedEmployeeId} 
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm new password"
            />
          </div>
        </CardContent>
        <br />
        <CardFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 