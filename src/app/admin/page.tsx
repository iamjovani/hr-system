"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Printer, UserPlus, Pencil, Trash2 } from 'lucide-react';
import Navbar from '../component/Navbar';
import { useAppContext } from '../context/AppContext';
import { Employee } from '../types';

export default function AdminDashboard() {
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ name: '', payRate: undefined });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const router = useRouter();
  
  const { 
    employees, 
    timeRecords, 
    currentUser, 
    setCurrentUser,
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    calculateStats,
    isLoaded
  } = useAppContext();

  // Redirect if not admin
  useEffect(() => {
    if (isLoaded && (!currentUser || !currentUser.isAdmin)) {
      router.push('/login');
    }
  }, [currentUser, router, isLoaded]);

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || newEmployee.payRate === undefined) {
      toast.error("Missing fields: Please fill out all fields");
      return;
    }
    
    addEmployee({
      ...newEmployee,
      payRate: parseFloat(newEmployee.payRate.toString())
    });
    
    setNewEmployee({ name: '', payRate: undefined });
    toast.success(`${newEmployee.name} has been added to the system.`);
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name || editingEmployee.payRate === undefined) {
      toast.error("Missing fields: Please fill out all fields");
      return;
    }
    
    try {
      await updateEmployee(editingEmployee.id, {
        name: editingEmployee.name,
        payRate: parseFloat(editingEmployee.payRate.toString())
      });
      
      setEditingEmployee(null);
      toast.success("Employee information has been updated.");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update employee. Please try again.");
    }
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteEmployee(id);
      toast.success(`${name} has been removed from the system.`);
    }
  };

  const handlePrintTimesheet = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const stats = calculateStats(employeeId);
    
    // In a real app, this would generate a proper report.
    // Here we'll just open a new window with the data.
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    
    let totalHours = 0;
    let totalPay = 0;
    
    stats.forEach(stat => {
      totalHours += stat.hoursWorked;
      totalPay += stat.pay;
    });
    
    reportWindow.document.write(`
      <html>
        <head>
          <title>Timesheet - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1, h2 { margin-bottom: 10px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { margin-top: 30px; font-weight: bold; }
            .print-button { margin-bottom: 20px; padding: 10px; }
            @media print {
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">Print Report</button>
          <h1>Employee Timesheet</h1>
          <h2>${employee.name} (ID: ${employee.id})</h2>
          <p>Pay Rate: $${employee.payRate.toFixed(2)} per hour</p>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Pay</th>
              </tr>
            </thead>
            <tbody>
              ${stats.map(stat => `
                <tr>
                  <td>${new Date(stat.clockInTime).toLocaleDateString()}</td>
                  <td>${new Date(stat.clockInTime).toLocaleString()}</td>
                  <td>${new Date(stat.clockOutTime as string).toLocaleString()}</td>
                  <td>${stat.hoursWorked}</td>
                  <td>$${stat.pay.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <p>Total Hours: ${totalHours.toFixed(2)}</p>
            <p>Total Pay: $${totalPay.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    
    reportWindow.document.close();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  if (!isLoaded || !currentUser || !currentUser.isAdmin) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <>
      <Navbar currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <div className="container mx-auto p-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>
              Manage employees and view time records
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="time-records">Time Records</TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Employee Management</CardTitle>
                  <CardDescription>Add, edit, or remove employees</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Employee
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form onSubmit={handleAddEmployee}>
                      <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                        <DialogDescription>
                          Enter employee details below.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            value={newEmployee.name}
                            onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="payRate">Pay Rate ($ per hour)</Label>
                          <Input
                            id="payRate"
                            type="number"
                            step="0.01"
                            min="0"
                            value={newEmployee.payRate === undefined ? '' : newEmployee.payRate}
                            onChange={(e) => setNewEmployee({
                              ...newEmployee, 
                              payRate: e.target.value === '' ? undefined : parseFloat(e.target.value)
                            })}
                            placeholder="15.00"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Add Employee</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Pay Rate</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.id}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>${employee.payRate.toFixed(2)}/hr</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setEditingEmployee({ ...employee })}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              {editingEmployee && (
                                <form onSubmit={handleEditEmployee}>
                                  <DialogHeader>
                                    <DialogTitle>Edit Employee</DialogTitle>
                                    <DialogDescription>
                                      Update employee details.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-name">Full Name</Label>
                                      <Input
                                        id="edit-name"
                                        value={editingEmployee.name}
                                        onChange={(e) => setEditingEmployee({
                                          ...editingEmployee, 
                                          name: e.target.value
                                        })}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-payRate">Pay Rate ($ per hour)</Label>
                                      <Input
                                        id="edit-payRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingEmployee.payRate}
                                        onChange={(e) => setEditingEmployee({
                                          ...editingEmployee, 
                                          payRate: parseFloat(e.target.value)
                                        })}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button type="submit">Save Changes</Button>
                                  </DialogFooter>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handlePrintTimesheet(employee.id)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time-records">
            <Card>
              <CardHeader>
                <CardTitle>Time Records</CardTitle>
                <CardDescription>
                  View all employee time records
                </CardDescription>
              </CardHeader>
              <CardContent>
                {timeRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Clock In</TableHead>
                        <TableHead>Clock Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeRecords
                        .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime())
                        .map((record) => {
                          const employee = employees.find(emp => emp.id === record.employeeId);
                          const clockIn = new Date(record.clockInTime);
                          const clockOut = record.clockOutTime ? new Date(record.clockOutTime) : null;
                          const hoursWorked = clockOut 
                            ? ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2)
                            : 'In progress';
                            
                          return (
                            <TableRow key={record.id}>
                              <TableCell>{employee?.name || 'Unknown'}</TableCell>
                              <TableCell>{clockIn.toLocaleDateString()}</TableCell>
                              <TableCell>{formatDate(record.clockInTime)}</TableCell>
                              <TableCell>
                                {record.clockOutTime ? formatDate(record.clockOutTime) : '-'}
                              </TableCell>
                              <TableCell>{hoursWorked}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  record.clockOutTime ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {record.clockOutTime ? 'Completed' : 'Active'}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No time records found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}