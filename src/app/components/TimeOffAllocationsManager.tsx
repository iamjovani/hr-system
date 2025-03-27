"use client";

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { Employee, TimeOffAllocation } from '../types';

export default function TimeOffAllocationsManager() {
  const { employees } = useAppContext();
  const [allocations, setAllocations] = useState<(TimeOffAllocation & { employeeName?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [editingAllocation, setEditingAllocation] = useState<TimeOffAllocation | null>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    year: selectedYear,
    ptoTotal: 80,
    sickDaysTotal: 40,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch existing allocations
  const fetchAllocations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/time-off/allocations?year=${selectedYear}`);
      const data = await response.json();
      if (response.ok) {
        setAllocations(data);
      } else {
        toast.error(`Failed to fetch allocations: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching allocations:', error);
      toast.error('Failed to fetch time-off allocations');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch allocations when year changes
  useEffect(() => {
    fetchAllocations();
  }, [selectedYear]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | { name: string; value: string | number }) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/time-off/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          ptoTotal: Number(formData.ptoTotal),
          sickDaysTotal: Number(formData.sickDaysTotal)
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(editingAllocation 
          ? 'Time-off allocation updated successfully!' 
          : 'Time-off allocation created successfully!'
        );
        setDialogOpen(false);
        setEditingAllocation(null);
        resetForm();
        fetchAllocations();
      } else {
        toast.error(`Failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error saving allocation:', error);
      toast.error('Failed to save time-off allocation');
    }
  };

  // Reset form to defaults
  const resetForm = () => {
    setFormData({
      employeeId: '',
      year: selectedYear,
      ptoTotal: 80,
      sickDaysTotal: 40,
    });
  };

  // Open dialog for editing
  const openEditDialog = (allocation: TimeOffAllocation) => {
    setEditingAllocation(allocation);
    setFormData({
      employeeId: allocation.employeeId,
      year: allocation.year,
      ptoTotal: allocation.ptoTotal,
      sickDaysTotal: allocation.sickDaysTotal,
    });
    setDialogOpen(true);
  };

  // Get years for dropdown (current year and next 5 years)
  const yearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear + i);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Time Off Allocations</CardTitle>
          <CardDescription>Manage employee PTO and sick day allocations</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue>{selectedYear}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearOptions().map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingAllocation(null);
                resetForm();
              }}>
                Add Allocation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingAllocation ? 'Edit' : 'Add'} Time Off Allocation</DialogTitle>
                <DialogDescription>
                  Set the PTO and sick day allocation for an employee.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => handleChange({ name: 'employeeId', value })}
                    disabled={!!editingAllocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee: Employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select
                    value={formData.year.toString()}
                    onValueChange={(value) => handleChange({ name: 'year', value: parseInt(value) })}
                    disabled={!!editingAllocation}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions().map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ptoTotal">PTO Days</Label>
                  <Input
                    id="ptoTotal"
                    name="ptoTotal"
                    type="number"
                    value={formData.ptoTotal}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sickDaysTotal">Sick Days</Label>
                  <Input
                    id="sickDaysTotal"
                    name="sickDaysTotal"
                    type="number"
                    value={formData.sickDaysTotal}
                    onChange={handleChange}
                    min={0}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingAllocation ? 'Save Changes' : 'Add Allocation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>PTO Total</TableHead>
                <TableHead>PTO Remaining</TableHead>
                <TableHead>Sick Days Total</TableHead>
                <TableHead>Sick Days Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : allocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No allocations found for {selectedYear}. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell>{allocation.employeeName}</TableCell>
                    <TableCell>{allocation.ptoTotal} days</TableCell>
                    <TableCell>{allocation.ptoRemaining} days</TableCell>
                    <TableCell>{allocation.sickDaysTotal} days</TableCell>
                    <TableCell>{allocation.sickDaysRemaining} days</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditDialog(allocation)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}