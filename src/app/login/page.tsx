"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';

export default function Login() {
  const [employeeId, setEmployeeId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setCurrentUser } = useAppContext();

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Fetch employee from API instead of local state
      const response = await fetch(`/api/employees/${employeeId}`);
      
      if (response.ok) {
        const employee = await response.json();
        setCurrentUser({ ...employee, isAdmin: false });
        
        // Clock in the employee
        const clockInResponse = await fetch('/api/clock/in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId })
        });
        
        const clockInResult = await clockInResponse.json();
        
        if (clockInResult.success) {
          toast.success(`Welcome, ${employee.name}! Clocked in successfully`);
        } else {
          toast.info(`Welcome, ${employee.name}! ${clockInResult.message}`);
        }
        
        router.push('/employee');
      } else {
        toast.error('Invalid employee ID. Please check your ID and try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: adminPassword })
      });
      
      if (response.ok) {
        const adminUser = await response.json();
        setCurrentUser(adminUser);
        toast.success('Admin logged in. Welcome to the admin dashboard!');
        router.push('/admin');
      } else {
        toast.error('Invalid admin password. Please check your password and try again.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">HR System Login</CardTitle>
          <CardDescription className="text-center">
            Clock in/out or access the admin dashboard
          </CardDescription>
        </CardHeader>
        <Tabs defaultValue="employee" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employee">Employee</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="employee">
            <form onSubmit={handleEmployeeLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <Input
                    id="employeeId"
                    placeholder="Enter your employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <br/>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Clock In/Out'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          <TabsContent value="admin">
            <form onSubmit={handleAdminLogin}>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Admin Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <br/>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Login as Admin'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}