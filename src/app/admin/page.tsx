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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Printer, UserPlus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Calendar, Key } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAppContext } from '../context/AppContext';
import { Employee } from '../types';
import { DatePicker } from '@/components/ui/date-picker';
import { format, isValid, isSameDay } from 'date-fns';
import AutoClockOutSettings from '../components/AutoClockOutSettings';

export default function AdminDashboard() {
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({ name: '', payRate: undefined });
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingTimeRecord, setEditingTimeRecord] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [payStartDate, setPayStartDate] = useState<Date | undefined>(undefined);
  const [payEndDate, setPayEndDate] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const { 
    employees, 
    timeRecords, 
    currentUser, 
    setCurrentUser,
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    updateTimeRecord,
    deleteTimeRecord,
    calculateStats,
    isLoaded
  } = useAppContext();

  // Redirect if not admin
  useEffect(() => {
    if (isLoaded && (!currentUser || !currentUser.isAdmin)) {
      router.push('/login');
    }
  }, [currentUser, router, isLoaded]);

  // Filter and paginate time records
  const filteredTimeRecords = timeRecords
    .filter(record => {
      // First apply date filter if set
      if (searchDate) {
        const recordDate = new Date(record.clockInTime);
        if (!isSameDay(recordDate, searchDate)) {
          return false;
        }
      }

      // If no text search, return all records that pass date filter
      if (searchQuery === '') return true;
      
      // Apply text search filter
      const employee = employees.find(emp => emp.id === record.employeeId);
      const employeeName = employee?.name || 'Unknown';
      
      return employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => new Date(b.clockInTime).getTime() - new Date(a.clockInTime).getTime());

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTimeRecords.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTimeRecords.length / itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchDate]);

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Clear date filter
  const clearDateFilter = () => {
    setSearchDate(undefined);
  };

  // Handle changes to payRate - safely parse numbers and avoid NaN
  const handlePayRateChange = (value: string, setStateFn: Function, currentState: any) => {
    if (value === '') {
      setStateFn({
        ...currentState,
        payRate: undefined
      });
      return;
    }
    
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setStateFn({
        ...currentState,
        payRate: parsed
      });
    }
  };

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
    
    toast.success(`${newEmployee.name} has been added to the system.`);
    setNewEmployee({ name: '', payRate: undefined });
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !editingEmployee.name || editingEmployee.payRate === undefined || isNaN(editingEmployee.payRate)) {
      toast.error("Missing or invalid fields: Please fill out all fields correctly");
      return;
    }
    
    try {
      await updateEmployee(editingEmployee.id, {
        name: editingEmployee.name,
        payRate: editingEmployee.payRate
      });
      toast.success("Employee information has been updated.");
      setEditingEmployee(null);
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

  const handleEditTimeRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimeRecord) {
      return;
    }
    
    try {
      await updateTimeRecord(editingTimeRecord.id, {
        clockInTime: new Date(editingTimeRecord.clockInTime).toISOString(),
        clockOutTime: editingTimeRecord.clockOutTime 
          ? new Date(editingTimeRecord.clockOutTime).toISOString() 
          : null
      });
      toast.success("Time record has been updated.");
      setEditingTimeRecord(null);
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update time record. Please try again.");
    }
  };

  const handleDeleteTimeRecord = (id: string, employeeName: string) => {
    if (window.confirm(`Are you sure you want to delete this time record for ${employeeName}?`)) {
      deleteTimeRecord(id);
      toast.success("Time record has been deleted.");
    }
  };

  const handlePrintTimesheet = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const stats = calculateStats(employeeId);
    
    // Filter stats by date range if set
    const filteredStats = stats.filter(stat => {
      const recordDate = new Date(stat.clockInTime);
      if (payStartDate && payEndDate) {
        return recordDate >= payStartDate && recordDate <= payEndDate;
      }
      return true;
    });
    
    // In a real app, this would generate a proper report.
    // Here we'll just open a new window with the data.
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) return;
    
    let totalHours = 0;
    let totalPay = 0;
    
    filteredStats.forEach(stat => {
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
            .date-range { margin-bottom: 20px; color: #666; }
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
          ${payStartDate && payEndDate ? `
            <div class="date-range">
              Period: ${payStartDate.toLocaleDateString()} - ${payEndDate.toLocaleDateString()}
            </div>
          ` : ''}
          
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
              ${filteredStats.map(stat => `
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordEmployee || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch('/api/auth/admin-reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: resetPasswordEmployee.id,
          newPassword
        })
      });

      if (response.ok) {
        toast.success(`Password reset successfully for ${resetPasswordEmployee.name}`);
        setResetPasswordEmployee(null);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('An error occurred while resetting the password');
    }
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

  // Format datetime for datetime-local input
  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  // Generate pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    
    // Previous page button
    buttons.push(
      <Button 
        key="prev" 
        variant="outline" 
        size="sm" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    );
    
    // Page number buttons
    const maxButtonsToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage + 1 < maxButtonsToShow) {
      startPage = Math.max(1, endPage - maxButtonsToShow + 1);
    }
    
    // First page
    if (startPage > 1) {
      buttons.push(
        <Button 
          key="1" 
          variant={currentPage === 1 ? "default" : "outline"} 
          size="sm" 
          onClick={() => handlePageChange(1)}
        >
          1
        </Button>
      );
      
      // Ellipsis if needed
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-2">...</span>
        );
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <Button 
          key={i} 
          variant={currentPage === i ? "default" : "outline"} 
          size="sm" 
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    // Last page
    if (endPage < totalPages) {
      // Ellipsis if needed
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-2">...</span>
        );
      }
      
      buttons.push(
        <Button 
          key={totalPages} 
          variant={currentPage === totalPages ? "default" : "outline"} 
          size="sm" 
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }
    
    // Next page button
    buttons.push(
      <Button 
        key="next" 
        variant="outline" 
        size="sm" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    );
    
    return buttons;
  };

  // If still loading or not an admin, show loading screen
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
            <CardDescription>Manage employees and view time records</CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="time-records">Time Records</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* EMPLOYEES TAB */}
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
                            onChange={(e) =>
                              setNewEmployee({ ...newEmployee, name: e.target.value })
                            }
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
                            value={newEmployee.payRate === undefined ? '' : String(newEmployee.payRate)}
                            onChange={(e) => handlePayRateChange(e.target.value, setNewEmployee, newEmployee)}
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setEditingEmployee({ ...employee })
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              {editingEmployee && editingEmployee.id === employee.id && (
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
                                        onChange={(e) =>
                                          setEditingEmployee({
                                            ...editingEmployee,
                                            name: e.target.value
                                          })
                                        }
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label htmlFor="edit-payRate">Pay Rate ($ per hour)</Label>
                                      <Input
                                        id="edit-payRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={String(editingEmployee.payRate)}
                                        onChange={(e) => handlePayRateChange(e.target.value, setEditingEmployee, editingEmployee)}
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
                            onClick={() =>
                              handleDeleteEmployee(employee.id, employee.name)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setResetPasswordEmployee(employee)}
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reset Password</DialogTitle>
                                <DialogDescription>
                                  Reset password for {resetPasswordEmployee?.name}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleResetPassword}>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                      id="newPassword"
                                      type="password"
                                      value={newPassword}
                                      onChange={(e) => setNewPassword(e.target.value)}
                                      placeholder="Enter new password"
                                      required
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                      id="confirmPassword"
                                      type="password"
                                      value={confirmPassword}
                                      onChange={(e) => setConfirmPassword(e.target.value)}
                                      placeholder="Confirm new password"
                                      required
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button type="submit">Reset Password</Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Print Timesheet</DialogTitle>
                                <DialogDescription>
                                  Select date range for the timesheet report
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                  <Label>Start Date</Label>
                                  <DatePicker 
                                    date={payStartDate} 
                                    setDate={setPayStartDate}
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label>End Date</Label>
                                  <DatePicker 
                                    date={payEndDate} 
                                    setDate={setPayEndDate}
                                  />
                                </div>
                                {(payStartDate || payEndDate) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setPayStartDate(undefined);
                                      setPayEndDate(undefined);
                                    }}
                                  >
                                    Clear Date Range
                                  </Button>
                                )}
                              </div>
                              <DialogFooter>
                                <Button 
                                  onClick={() => handlePrintTimesheet(employee.id)}
                                  disabled={payStartDate && payEndDate && payStartDate > payEndDate}
                                >
                                  Print Timesheet
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIME RECORDS TAB */}
          <TabsContent value="time-records">
            <Card>
              <CardHeader>
                <CardTitle>Time Records</CardTitle>
                <CardDescription>View, edit or delete employee time records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-6">
                  <div className="flex gap-4 items-center">
                    {/* Date Picker Filter */}
                    <div className="flex items-center gap-2">
                      <div className="w-56">
                        <DatePicker 
                          date={searchDate} 
                          setDate={setSearchDate}
                        />
                      </div>
                      {searchDate && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={clearDateFilter}
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Search box */}
                    <div className="relative w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by employee name..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="itemsPerPage">Show</Label>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={handleItemsPerPageChange}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm">per page</span>
                  </div>
                </div>

                {filteredTimeRecords.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Clock In</TableHead>
                          <TableHead>Clock Out</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentItems.map((record, index) => {
                          // Create a compound key using multiple properties to ensure uniqueness
                          const key = `${record.employeeId}-${record.clockInTime}-${index}`;

                          const employee = employees.find(
                            (emp) => emp.id === record.employeeId
                          );
                          const clockIn = new Date(record.clockInTime);
                          const clockOut = record.clockOutTime
                            ? new Date(record.clockOutTime)
                            : null;
                          const hoursWorked = clockOut
                            ? (
                                (clockOut.getTime() - clockIn.getTime()) /
                                (1000 * 60 * 60)
                              ).toFixed(2)
                            : 'In progress';

                          return (
                            <TableRow key={key}>
                              <TableCell>{employee?.name || 'Unknown'}</TableCell>
                              <TableCell>{clockIn.toLocaleDateString()}</TableCell>
                              <TableCell>{formatDate(record.clockInTime)}</TableCell>
                              <TableCell>
                                {record.clockOutTime
                                  ? formatDate(record.clockOutTime)
                                  : '-'}
                              </TableCell>
                              <TableCell>{hoursWorked}</TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    record.clockOutTime
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {record.clockOutTime ? 'Completed' : 'Active'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingTimeRecord({ ...record })}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    {editingTimeRecord && editingTimeRecord.id === record.id && (
                                      <form onSubmit={handleEditTimeRecord}>
                                        <DialogHeader>
                                          <DialogTitle>Edit Time Record</DialogTitle>
                                          <DialogDescription>
                                            Update time record for {employee?.name}.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-clockIn">Clock In Time</Label>
                                            <Input
                                              id="edit-clockIn"
                                              type="datetime-local"
                                              value={formatDateTimeLocal(editingTimeRecord.clockInTime)}
                                              onChange={(e) =>
                                                setEditingTimeRecord({
                                                  ...editingTimeRecord,
                                                  clockInTime: e.target.value
                                                })
                                              }
                                            />
                                          </div>
                                          <div className="grid gap-2">
                                            <Label htmlFor="edit-clockOut">Clock Out Time</Label>
                                            <Input
                                              id="edit-clockOut"
                                              type="datetime-local"
                                              value={
                                                editingTimeRecord.clockOutTime
                                                  ? formatDateTimeLocal(editingTimeRecord.clockOutTime)
                                                  : ''
                                              }
                                              onChange={(e) =>
                                                setEditingTimeRecord({
                                                  ...editingTimeRecord,
                                                  clockOutTime: e.target.value || null
                                                })
                                              }
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
                                  onClick={() => handleDeleteTimeRecord(record.id, employee?.name || 'Unknown')}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination controls */}
                    {filteredTimeRecords.length > 0 && (
                      <div className="flex items-center justify-between space-x-2 py-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredTimeRecords.length)} of {filteredTimeRecords.length} records
                        </div>
                        <div className="flex space-x-2">
                          {renderPaginationButtons()}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    {searchDate 
                      ? "No records found for the selected date." 
                      : searchQuery 
                        ? "No matching records found."
                        : "No time records found."}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 gap-6">
              <AutoClockOutSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}