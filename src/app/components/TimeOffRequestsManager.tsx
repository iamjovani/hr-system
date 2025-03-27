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
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { TimeOffRequest, TimeOffStatus } from '../types';
import { useAppContext } from '../context/AppContext';

export default function TimeOffRequestsManager() {
  const { employees } = useAppContext();
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TimeOffStatus | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch time-off requests with optional status filter
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const statusParam = filterStatus !== 'all' ? `status=${filterStatus}` : '';
      const response = await fetch(`/api/time-off/requests?${statusParam}`);
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data);
      } else {
        toast.error(`Failed to fetch requests: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching time-off requests:', error);
      toast.error('Failed to fetch time-off requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and when filter changes
  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM d, yyyy');
  };

  // Get badge color based on request status
  const getStatusBadgeVariant = (status: TimeOffStatus): "default" | "destructive" | "outline" | "secondary" => {
    switch (status) {
      case 'approved': return 'default'; // Changed from 'success' to 'default'
      case 'denied': return 'destructive';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  // Handle approving a request
  const handleApprove = async () => {
    if (!selectedRequest) return;
    await updateRequestStatus(selectedRequest.id, 'approved');
  };

  // Handle denying a request
  const handleDeny = async () => {
    if (!selectedRequest) return;
    await updateRequestStatus(selectedRequest.id, 'denied');
  };

  // Update request status
  const updateRequestStatus = async (id: number, status: TimeOffStatus) => {
    try {
      const response = await fetch(`/api/time-off/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Request ${status} successfully`);
        setDialogOpen(false);
        setSelectedRequest(null);
        setNotes('');
        fetchRequests();
      } else {
        toast.error(`Failed to update request: ${data.error}`);
      }
    } catch (error) {
      console.error(`Error ${status} request:`, error);
      toast.error(`Failed to ${status} request`);
    }
  };

  // Open review dialog for a request
  const openReviewDialog = (request: TimeOffRequest) => {
    setSelectedRequest(request);
    setNotes(request.notes || '');
    setDialogOpen(true);
  };

  // Get employee name by ID
  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee?.name || 'Unknown Employee';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Time Off Requests</CardTitle>
          <CardDescription>Review and manage employee time-off requests</CardDescription>
        </div>
        <div>
          <Select
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as TimeOffStatus | 'all')}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No {filterStatus !== 'all' ? filterStatus : ''} time-off requests found.
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.employeeName || getEmployeeName(request.employeeId)}</TableCell>
                    <TableCell>{request.requestType}</TableCell>
                    <TableCell>
                      {formatDate(request.startDate)} - {formatDate(request.endDate)}
                    </TableCell>
                    <TableCell>{request.durationHours} days</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(parseISO(request.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openReviewDialog(request)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Time Off Request</DialogTitle>
            <DialogDescription>
              Review the time-off request details and decide whether to approve or deny.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Employee</Label>
                  <p>{selectedRequest.employeeName || getEmployeeName(selectedRequest.employeeId)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Request Type</Label>
                  <p>{selectedRequest.requestType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Date</Label>
                  <p>{formatDate(selectedRequest.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Date</Label>
                  <p>{formatDate(selectedRequest.endDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <p>{selectedRequest.durationHours} days</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusBadgeVariant(selectedRequest.status)} className="mt-1">
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Additional Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this request (optional)"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedRequest?.status === 'pending' && (
              <>
                <Button variant="destructive" onClick={handleDeny}>
                  Deny Request
                </Button>
                <Button variant="default" onClick={handleApprove}>
                  Approve Request
                </Button>
              </>
            )}
            {selectedRequest?.status !== 'pending' && (
              <Button onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}